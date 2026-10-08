import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/providers/request_provider.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/document_types_error.dart';
import '../../widgets/loading_button.dart';

class CreateRequestScreen extends StatefulWidget {
  const CreateRequestScreen({super.key});

  @override
  State<CreateRequestScreen> createState() => _CreateRequestScreenState();
}

class _CreateRequestScreenState extends State<CreateRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  final _purposeCtrl = TextEditingController();
  int? _selectedDocTypeId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<RequestProvider>().fetchDocumentTypes();
    });
  }

  @override
  void dispose() {
    _purposeCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final success =
        await context.read<RequestProvider>().createRegisteredRequest(
              documentTypeId: _selectedDocTypeId!,
              purpose: _purposeCtrl.text.trim(),
            );
    if (!mounted) return;
    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Request submitted successfully!'),
          backgroundColor: Color(0xFF1A6B4A),
        ),
      );
      Navigator.of(context).pop();
    } else {
      final msg = context.read<RequestProvider>().errorMessage;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(msg ?? 'Submission failed.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<RequestProvider>();
    final isLoading = provider.status == RequestStatus.submitting;

    return Scaffold(
      backgroundColor: const Color(0xFFF5F8F6),
      appBar: AppBar(title: const Text('Request a Document')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1A6B4A).withOpacity(0.07),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.info_outline, color: Color(0xFF1A6B4A)),
                      const SizedBox(width: 10),
                      const Expanded(
                        child: Text(
                          'Your verified ID on file will be used for this request.',
                          style: TextStyle(
                            fontSize: 13,
                            color: Color(0xFF1A6B4A),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                const Text(
                  'Document Type',
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                ),
                const SizedBox(height: 8),
                DropdownButtonFormField<int>(
                  key: const Key('create_req_doc_type'),
                  value: _selectedDocTypeId,
                  decoration: InputDecoration(
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12)),
                    filled: true,
                    fillColor: const Color(0xFFF8FAF9),
                    hintText: 'Select document type',
                  ),
                  items: provider.documentTypes
                      .map((dt) => DropdownMenuItem(
                            value: dt.id,
                            child: Text(dt.name),
                          ))
                      .toList(),
                  onChanged: (v) => setState(() => _selectedDocTypeId = v),
                  validator: (v) =>
                      v == null ? 'Please select a document' : null,
                ),
                DocumentTypesError(provider: provider),
                const SizedBox(height: 20),
                const Text(
                  'Purpose',
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                ),
                const SizedBox(height: 8),
                AppTextField(
                  id: 'create_req_purpose',
                  label: 'e.g., Employment requirement',
                  controller: _purposeCtrl,
                  maxLines: 3,
                  validator: (v) =>
                      (v == null || v.isEmpty) ? 'Purpose is required' : null,
                ),
                const SizedBox(height: 32),
                LoadingButton(
                  id: 'btn_create_request_submit',
                  label: 'Submit Request',
                  isLoading: isLoading,
                  onPressed: _submit,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
