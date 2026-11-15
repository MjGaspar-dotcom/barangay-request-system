import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';

import '../../../core/models/recommendation.dart';
import '../../../core/models/request_model.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/request_provider.dart';
import '../../../core/services/recommendation_engine.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/document_types_error.dart';
import '../../widgets/loading_button.dart';

class CreateRequestScreen extends StatefulWidget {
  const CreateRequestScreen({super.key, this.initialDocumentTypeId});

  final int? initialDocumentTypeId;

  @override
  State<CreateRequestScreen> createState() => _CreateRequestScreenState();
}

class _CreateRequestScreenState extends State<CreateRequestScreen> {
  static const _purposeOptions = [
    'Employment requirement',
    'Scholarship application',
    'School enrollment',
    'Financial assistance',
    'Business permit',
    'Proof of residency',
    'Personal use',
    'Other',
  ];

  final _formKey = GlobalKey<FormState>();
  final _purposeCtrl = TextEditingController();
  final _recommendationEngine = RecommendationEngine();
  int? _selectedDocTypeId;
  String? _selectedPurpose;

  @override
  void initState() {
    super.initState();
    _selectedDocTypeId = widget.initialDocumentTypeId;
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
              purpose: _selectedPurpose == 'Other'
                  ? _purposeCtrl.text.trim()
                  : _selectedPurpose!,
            );
    if (!mounted) return;
    if (success) {
      final request = context.read<RequestProvider>().submittedRequest;
      if (request == null || request.qrCode == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('The request receipt could not be loaded.')),
        );
        return;
      }

      await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          title: const Text('Request Submitted'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Save this QR receipt to track your request.'),
                const SizedBox(height: 16),
                SvgPicture.string(
                  request.qrCode!,
                  width: 200,
                  height: 200,
                  semanticsLabel: 'Request tracking QR code',
                ),
                const SizedBox(height: 12),
                SelectableText(
                  request.trackingNumber ?? '',
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Done'),
            ),
          ],
        ),
      );
      if (mounted) Navigator.of(context).pop();
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
    final user = context.watch<AuthProvider>().user;
    final isLoading = provider.status == RequestStatus.submitting;
    Recommendation? recommendation;
    DocumentType? recommendedDocument;

    if (user != null) {
      final recommendations = _recommendationEngine.recommend(
        resident: user,
        residents: const [],
        documentTypes: provider.documentTypes,
      );
      for (final ranked in recommendations) {
        for (final document in provider.documentTypes) {
          if (document.name.trim().toLowerCase() ==
              ranked.documentType.toLowerCase()) {
            recommendation = ranked;
            recommendedDocument = document;
            break;
          }
        }
        if (recommendedDocument != null) break;
      }
    }

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
                if (recommendation != null && recommendedDocument != null) ...[
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1A6B4A).withValues(alpha: 0.07),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: const Color(0xFF1A6B4A).withValues(alpha: 0.18),
                      ),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.lightbulb_outline,
                            color: Color(0xFF1A6B4A)),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Recommended for you',
                                style: TextStyle(
                                  color: Color(0xFF1A6B4A),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 3),
                              Text(
                                recommendedDocument.name,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                recommendation.reason,
                                style: const TextStyle(fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                        TextButton(
                          onPressed: () => setState(() {
                            _selectedDocTypeId = recommendedDocument!.id;
                          }),
                          child: const Text('Use'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
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
                DropdownButtonFormField<String>(
                  key: const Key('create_req_purpose'),
                  initialValue: _selectedPurpose,
                  decoration: InputDecoration(
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    filled: true,
                    fillColor: const Color(0xFFF8FAF9),
                    hintText: 'Select purpose',
                  ),
                  items: _purposeOptions
                      .map((purpose) => DropdownMenuItem(
                            value: purpose,
                            child: Text(purpose),
                          ))
                      .toList(),
                  onChanged: (value) => setState(() {
                    _selectedPurpose = value;
                    if (value != 'Other') _purposeCtrl.clear();
                  }),
                  validator: (value) =>
                      value == null ? 'Please select a purpose' : null,
                ),
                if (_selectedPurpose == 'Other') ...[
                  const SizedBox(height: 12),
                  AppTextField(
                    id: 'create_req_other_purpose',
                    label: 'Describe your purpose',
                    controller: _purposeCtrl,
                    maxLines: 2,
                    validator: (value) =>
                        (value == null || value.trim().isEmpty)
                            ? 'Please describe your purpose'
                            : null,
                  ),
                ],
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
