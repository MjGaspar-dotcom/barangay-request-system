import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:pdfrx/pdfrx.dart';
import 'package:share_plus/share_plus.dart';

import '../../../core/models/generated_document.dart';
import '../../../core/models/request_model.dart';
import '../../../core/services/api_service.dart';
import '../../../core/theme/app_theme.dart';

class GeneratedDocumentScreen extends StatefulWidget {
  final BarangayRequest request;

  const GeneratedDocumentScreen({
    super.key,
    required this.request,
  });

  @override
  State<GeneratedDocumentScreen> createState() =>
      _GeneratedDocumentScreenState();
}

class _GeneratedDocumentScreenState extends State<GeneratedDocumentScreen> {
  GeneratedDocument? _document;
  Uint8List? _pdfBytes;
  String? _errorMessage;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadDocument();
  }

  Future<void> _loadDocument() async {
    setState(() {
      _loading = true;
      _document = null;
      _pdfBytes = null;
      _errorMessage = null;
    });

    try {
      final response = await ApiService.getGeneratedDocument(widget.request.id);
      final document = GeneratedDocument.fromApiResponse(response.data);
      Uint8List? pdfBytes;

      if (document.isPdf) {
        try {
          final fileResponse =
              await ApiService.getGeneratedDocumentFile(widget.request.id);
          final data = fileResponse.data;
          if (data is Uint8List) {
            pdfBytes = data;
          } else if (data is List<int>) {
            pdfBytes = Uint8List.fromList(data);
          } else {
            throw const FormatException(
              'The server returned an invalid PDF file.',
            );
          }
          if (pdfBytes.isEmpty) {
            throw const FormatException(
              'The server returned an empty PDF file.',
            );
          }
        } on DioException catch (error) {
          if (mounted) {
            setState(() {
              _document = document;
              _errorMessage = ApiService.errorMessage(error);
            });
          }
          return;
        }
      }

      if (!mounted) return;
      setState(() {
        _document = document;
        _pdfBytes = pdfBytes;
      });
    } on DioException catch (error) {
      if (mounted) {
        setState(() => _errorMessage = ApiService.errorMessage(error));
      }
    } on FormatException catch (error) {
      if (mounted) setState(() => _errorMessage = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.request.documentType?.name ?? 'Generated Document';

    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: [
          if (_pdfBytes != null)
            IconButton(
              tooltip: 'Save or share PDF',
              onPressed: _sharePdf,
              icon: const Icon(Icons.share_outlined),
            ),
          IconButton(
            tooltip: 'Refresh document',
            onPressed: _loading ? null : _loadDocument,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: SafeArea(
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _buildContent(title),
      ),
    );
  }

  Future<void> _sharePdf() async {
    final document = _document;
    final bytes = _pdfBytes;
    if (document == null || bytes == null) return;

    try {
      if (kIsWeb) Share.downloadFallbackEnabled = true;
      await Share.shareXFiles(
        [
          XFile.fromData(
            bytes,
            mimeType: 'application/pdf',
            name: document.fileName,
          ),
        ],
        subject: document.documentNumber ?? 'Barangay document',
      );
    } on PlatformException catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            error.message ?? 'The PDF could not be shared from this device.',
          ),
        ),
      );
    }
  }

  Widget _buildContent(String title) {
    final document = _document;
    if (document == null) {
      return _DocumentError(
        message: _errorMessage ?? 'The generated document is unavailable.',
        onRetry: _loadDocument,
      );
    }

    if (document.isPdf && _pdfBytes != null) {
      return Column(
        children: [
          if (_errorMessage != null)
            _InlineDocumentError(message: _errorMessage!),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Text(
              'Use the top-right button to save or share this PDF.',
              style: TextStyle(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                fontSize: 12,
              ),
            ),
          ),
          Expanded(
            child: PdfViewer.data(
              _pdfBytes!,
              sourceName: 'generated-document-${widget.request.id}.pdf',
              params: PdfViewerParams(
                pageOverlaysBuilder: (context, pageRect, page) => [
                  IgnorePointer(
                    child: Center(
                      child: Opacity(
                        opacity: 0.1,
                        child: Image.asset(
                          'assets/images/logo.webp',
                          width: pageRect.width * 0.55,
                          height: pageRect.height * 0.45,
                          fit: BoxFit.contain,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      );
    }

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        if (_errorMessage != null) ...[
          _InlineDocumentError(message: _errorMessage!),
          const SizedBox(height: 12),
        ],
        _DocumentDataPreview(
          title: title,
          document: document,
        ),
        if (!document.isPdf) ...[
          const SizedBox(height: 12),
          const Text(
            'A downloadable PDF is not available for this document.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.textSecondary),
          ),
        ],
      ],
    );
  }
}

class _DocumentDataPreview extends StatelessWidget {
  final String title;
  final GeneratedDocument document;

  const _DocumentDataPreview({
    required this.title,
    required this.document,
  });

  @override
  Widget build(BuildContext context) {
    final fields = document.documentData.entries
        .where(
          (entry) =>
              entry.value != null &&
              entry.value is! Map &&
              entry.value is! List,
        )
        .toList();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'BARANGAYEASE',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: AppColors.primary,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.2,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
              ),
            ),
            if (document.documentNumber != null) ...[
              const SizedBox(height: 6),
              Text(
                'Document No. ${document.documentNumber}',
                textAlign: TextAlign.center,
              ),
            ],
            const Divider(height: 32),
            for (final field in fields)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 7),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      flex: 2,
                      child: Text(
                        _labelFor(field.key),
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 3,
                      child: Text(
                        field.value.toString(),
                        textAlign: TextAlign.end,
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
            if (fields.isEmpty)
              const Text(
                'The server returned no document fields to preview.',
                textAlign: TextAlign.center,
              ),
          ],
        ),
      ),
    );
  }

  String _labelFor(String key) {
    return key
        .replaceAll('_', ' ')
        .split(' ')
        .where((part) => part.isNotEmpty)
        .map((part) => '${part[0].toUpperCase()}${part.substring(1)}')
        .join(' ');
  }
}

class _DocumentError extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _DocumentError({
    required this.message,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.description_outlined, size: 48),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Try again'),
            ),
          ],
        ),
      ),
    );
  }
}

class _InlineDocumentError extends StatelessWidget {
  final String message;

  const _InlineDocumentError({required this.message});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.warningContainer,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            const Icon(Icons.info_outline, color: AppColors.warningDark),
            const SizedBox(width: 8),
            Expanded(child: Text(message)),
          ],
        ),
      ),
    );
  }
}
