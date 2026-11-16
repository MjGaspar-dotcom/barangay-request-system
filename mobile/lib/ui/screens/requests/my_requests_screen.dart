import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';
import 'package:dio/dio.dart';

import '../../../core/providers/request_provider.dart';
import '../../../core/models/request_model.dart';
import '../../../core/services/api_service.dart';
import '../../widgets/status_chip.dart';
import 'create_request_screen.dart';
import 'generated_document_screen.dart';

class MyRequestsScreen extends StatefulWidget {
  const MyRequestsScreen({super.key});

  @override
  State<MyRequestsScreen> createState() => _MyRequestsScreenState();
}

class _MyRequestsScreenState extends State<MyRequestsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<RequestProvider>().fetchMyRequests();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<RequestProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFF5F8F6),
      appBar: AppBar(
        title: const Text('My Requests'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => context.read<RequestProvider>().fetchMyRequests(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        key: const Key('fab_new_request'),
        onPressed: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const CreateRequestScreen()),
        ),
        backgroundColor: const Color(0xFF1A6B4A),
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('New Request', style: TextStyle(color: Colors.white)),
      ),
      body: Builder(
        builder: (_) {
          if (provider.status == RequestStatus.loading) {
            return const Center(child: CircularProgressIndicator());
          }
          if (provider.requests.isEmpty) {
            return _buildEmpty(context);
          }
          return RefreshIndicator(
            onRefresh: () => context.read<RequestProvider>().fetchMyRequests(),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: provider.requests.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (_, i) =>
                  _RequestListItem(request: provider.requests[i]),
            ),
          );
        },
      ),
    );
  }

  Widget _buildEmpty(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.folder_open, size: 72, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text(
            'No requests found',
            style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.grey[600]),
          ),
          const SizedBox(height: 8),
          Text(
            'Tap the button below to make your first request.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey[500]),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const CreateRequestScreen()),
            ),
            icon: const Icon(Icons.add),
            label: const Text('Make a Request'),
          ),
        ],
      ),
    );
  }
}

class _RequestListItem extends StatelessWidget {
  final BarangayRequest request;
  const _RequestListItem({required this.request});

  Future<void> _completeBusinessDetails(BuildContext context) async {
    final requestProvider = context.read<RequestProvider>();
    final formKey = GlobalKey<FormState>();
    final businessName = TextEditingController(
      text: request.requestData?['business_name']?.toString() ?? '',
    );
    final businessAddress = TextEditingController(
      text: request.requestData?['business_address']?.toString() ?? '',
    );
    final businessActivity = TextEditingController(
      text: request.requestData?['business_activity']?.toString() ?? '',
    );

    final shouldSave = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Business Details'),
        content: SingleChildScrollView(
          child: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: businessName,
                  decoration: const InputDecoration(labelText: 'Business name'),
                  validator: _requiredValue,
                ),
                TextFormField(
                  controller: businessAddress,
                  decoration:
                      const InputDecoration(labelText: 'Business address'),
                  validator: _requiredValue,
                ),
                TextFormField(
                  controller: businessActivity,
                  decoration:
                      const InputDecoration(labelText: 'Nature of business'),
                  validator: _requiredValue,
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              if (formKey.currentState?.validate() ?? false) {
                Navigator.of(dialogContext).pop(true);
              }
            },
            child: const Text('Generate PDF'),
          ),
        ],
      ),
    );

    if (shouldSave != true) {
      businessName.dispose();
      businessAddress.dispose();
      businessActivity.dispose();
      return;
    }

    try {
      final response = await ApiService.updateBusinessDetails(
        request.id,
        {
          'business_name': businessName.text.trim(),
          'business_address': businessAddress.text.trim(),
          'business_activity': businessActivity.text.trim(),
        },
      );
      if (response.data is! Map || response.data['success'] != true) {
        throw const FormatException('The PDF could not be generated.');
      }

      await requestProvider.fetchMyRequests();
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Business details saved. Your PDF is generating in the background.',
            ),
          ),
        );
      }
    } on DioException catch (exception) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(ApiService.errorMessage(exception))),
        );
      }
    } on FormatException catch (exception) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(exception.message)),
        );
      }
    } finally {
      businessName.dispose();
      businessAddress.dispose();
      businessActivity.dispose();
    }
  }

  String? _requiredValue(String? value) =>
      value == null || value.trim().isEmpty ? 'This field is required' : null;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFEDF0EC)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  request.documentType?.name ?? 'Document Request',
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                    color: Color(0xFF1A2E1F),
                  ),
                ),
              ),
              StatusChip(status: request.status),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'Purpose: ${request.purpose}',
            style: TextStyle(fontSize: 13, color: Colors.grey[600]),
          ),
          if (request.remarks != null && request.remarks!.isNotEmpty) ...[
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFF0F0F0),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info_outline, size: 14, color: Colors.grey),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      request.remarks!,
                      style:
                          const TextStyle(fontSize: 12, color: Colors.black54),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 8),
          Text(
            _formatDate(request.createdAt),
            style: TextStyle(fontSize: 11, color: Colors.grey[400]),
          ),
          if (request.needsBusinessDetails) ...[
            const SizedBox(height: 8),
            OutlinedButton.icon(
              key: Key('btn_business_details_${request.id}'),
              onPressed: () => _completeBusinessDetails(context),
              icon: const Icon(Icons.edit_note),
              label: const Text('Complete Business Details'),
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF1A6B4A),
                side: const BorderSide(color: Color(0xFF1A6B4A)),
              ),
            ),
          ],
          if (request.qrCode != null && request.qrCode!.isNotEmpty) ...[
            const SizedBox(height: 8),
            TextButton.icon(
              key: Key('btn_request_receipt_${request.id}'),
              onPressed: () => showDialog<void>(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('Request QR Receipt'),
                  content: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      SvgPicture.string(
                        request.qrCode!,
                        width: 180,
                        height: 180,
                        semanticsLabel: 'Request tracking QR code',
                      ),
                      const SizedBox(height: 12),
                      SelectableText(
                        request.trackingNumber ?? '',
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Close'),
                    ),
                  ],
                ),
              ),
              icon: const Icon(Icons.qr_code_2),
              label: const Text('View QR Receipt'),
              style: TextButton.styleFrom(
                foregroundColor: const Color(0xFF1A6B4A),
              ),
            ),
          ],
          if (request.hasGeneratedPdf ||
              [
                'ready_for_pickup',
                'completed',
              ].contains(request.status.toLowerCase())) ...[
            const SizedBox(height: 12),
            OutlinedButton.icon(
              key: Key('btn_generated_document_${request.id}'),
              onPressed: request.id <= 0
                  ? null
                  : () => Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => GeneratedDocumentScreen(
                            requestId: request.id,
                            documentName:
                                request.documentType?.name ?? 'Generated PDF',
                          ),
                        ),
                      ),
              icon: const Icon(Icons.picture_as_pdf_outlined),
              label: const Text('View Generated Document'),
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF1A6B4A),
                side: const BorderSide(color: Color(0xFF1A6B4A)),
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _formatDate(String raw) {
    try {
      final dt = DateTime.parse(raw).toLocal();
      return '${dt.month}/${dt.day}/${dt.year}';
    } catch (_) {
      return raw;
    }
  }
}
