import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:pdfrx/pdfrx.dart';

import '../../../core/models/generated_document.dart';
import '../../../core/services/api_service.dart';

class GeneratedDocumentScreen extends StatefulWidget {
  final int requestId;
  final String documentName;

  const GeneratedDocumentScreen({
    super.key,
    required this.requestId,
    required this.documentName,
  });

  @override
  State<GeneratedDocumentScreen> createState() =>
      _GeneratedDocumentScreenState();
}

class _GeneratedDocumentScreenState extends State<GeneratedDocumentScreen> {
  Uint8List? _pdfBytes;
  GeneratedDocument? _document;
  String? _error;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadDocument();
  }

  Future<void> _loadDocument() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final metadataResponse =
          await ApiService.getGeneratedDocument(widget.requestId);
      final payload = metadataResponse.data;
      if (payload is! Map ||
          payload['success'] != true ||
          payload['data'] is! Map) {
        throw const FormatException(
            'The generated document response was invalid.');
      }

      final data = payload['data'] as Map;
      if (data['generated_document'] is! Map) {
        throw const FormatException(
          'A generated PDF is not available for this request yet.',
        );
      }

      final document = GeneratedDocument.fromJson(
        Map<String, dynamic>.from(data['generated_document'] as Map),
      );
      if (document.id <= 0) {
        throw const FormatException(
            'The generated PDF information is incomplete.');
      }

      final fileResponse =
          await ApiService.getGeneratedDocumentFile(widget.requestId);
      final responseBytes = fileResponse.data;
      if (responseBytes == null || responseBytes.isEmpty) {
        throw const FormatException('The generated PDF file is empty.');
      }
      final bytes = Uint8List.fromList(responseBytes);

      if (!mounted) return;
      setState(() {
        _document = document;
        _pdfBytes = bytes;
        _isLoading = false;
      });
    } on DioException catch (exception) {
      if (!mounted) return;
      setState(() {
        _error = ApiService.errorMessage(exception);
        _isLoading = false;
      });
    } on FormatException catch (exception) {
      if (!mounted) return;
      setState(() {
        _error = exception.message;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final document = _document;
    final bytes = _pdfBytes;

    return Scaffold(
      backgroundColor: const Color(0xFFF5F8F6),
      appBar: AppBar(
        title: Text(widget.documentName),
        actions: [
          IconButton(
            tooltip: 'Reload document',
            onPressed: _isLoading ? null : _loadDocument,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _DocumentError(
                  message: _error!,
                  onRetry: _loadDocument,
                )
              : bytes == null || document == null
                  ? _DocumentError(
                      message: 'The generated PDF could not be loaded.',
                      onRetry: _loadDocument,
                    )
                  : Column(
                      children: [
                        Container(
                          width: double.infinity,
                          color: Colors.white,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 10,
                          ),
                          child: Text(
                            'Document ${document.documentNumber} · '
                            'Version ${document.versionNumber}',
                            style: const TextStyle(
                              color: Color(0xFF1A2E1F),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        Expanded(
                          child: PdfViewer.data(
                            bytes,
                            sourceName: 'request-${widget.requestId}-'
                                'v${document.versionNumber}.pdf',
                          ),
                        ),
                      ],
                    ),
    );
  }
}

class _DocumentError extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _DocumentError({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.description_outlined,
              size: 52,
              color: Color(0xFF1A6B4A),
            ),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }
}
