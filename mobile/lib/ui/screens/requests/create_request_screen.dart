import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/models/recommendation.dart';
import '../../../core/models/request_model.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/request_provider.dart';
import '../../../core/services/recommendation_engine.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/input_validators.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/document_types_error.dart';
import '../../widgets/loading_button.dart';
import 'generated_document_screen.dart';
import '../../widgets/qr_receipt_dialog.dart';

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
  final _businessNameCtrl = TextEditingController();
  final _businessAddressCtrl = TextEditingController();
  final _businessActivityCtrl = TextEditingController();
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
    _businessNameCtrl.dispose();
    _businessAddressCtrl.dispose();
    _businessActivityCtrl.dispose();
    super.dispose();
  }

  bool _requiresBusinessDetails(RequestProvider provider) {
    for (final document in provider.documentTypes) {
      if (document.id == _selectedDocTypeId) {
        return document.name.trim().toLowerCase() ==
            'barangay business clearance';
      }
    }
    return false;
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final requestProvider = context.read<RequestProvider>();
    final requestData = _requiresBusinessDetails(requestProvider)
        ? {
            'business_name': _businessNameCtrl.text.trim(),
            'business_address': _businessAddressCtrl.text.trim(),
            'business_activity': _businessActivityCtrl.text.trim(),
          }
        : null;
    final success = await requestProvider.createRegisteredRequest(
      documentTypeId: _selectedDocTypeId!,
      purpose: _selectedPurpose == 'Other'
          ? _purposeCtrl.text.trim()
          : _selectedPurpose!,
      requestData: requestData,
    );
    if (!mounted) return;
    if (success) {
      final request = context.read<RequestProvider>().submittedRequest;
      final trackingNumber = request?.trackingNumber;
      if (request == null || trackingNumber == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Request submitted, but the server did not return a receipt.',
            ),
          ),
        );
        return;
      }

      final previewDocument = await QrReceiptDialog.show(
        context,
        trackingNumber: trackingNumber,
        qrCodeSvg: request.qrCodeSvg,
        documentName: request.documentType?.name,
        canPreviewDocument:
            requestProvider.submittedGeneratedDocumentId != null,
      );
      if (!mounted) return;
      if (previewDocument == true) {
        await Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => GeneratedDocumentScreen(
              request: request,
            ),
          ),
        );
      }
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
                    color: AppColors.primary.withValues(alpha: 0.07),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.info_outline, color: Color(0xFF1A6B4A)),
                      SizedBox(width: 10),
                      Expanded(
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
                  initialValue: _selectedDocTypeId,
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
                if (_requiresBusinessDetails(provider)) ...[
                  const SizedBox(height: 24),
                  const Text(
                    'Business details',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                  ),
                  const SizedBox(height: 8),
                  AppTextField(
                    id: 'create_req_business_name',
                    label: 'Business name',
                    controller: _businessNameCtrl,
                    maxLength: 255,
                    textCapitalization: TextCapitalization.words,
                    validator: (value) => InputValidators.requiredText(
                      value,
                      maxLength: 255,
                    ),
                  ),
                  const SizedBox(height: 12),
                  AppTextField(
                    id: 'create_req_business_address',
                    label: 'Business address',
                    controller: _businessAddressCtrl,
                    maxLines: 2,
                    maxLength: 500,
                    textCapitalization: TextCapitalization.sentences,
                    validator: (value) => InputValidators.requiredText(
                      value,
                      maxLength: 500,
                    ),
                  ),
                  const SizedBox(height: 12),
                  AppTextField(
                    id: 'create_req_business_activity',
                    label: 'Business activity',
                    controller: _businessActivityCtrl,
                    maxLength: 255,
                    textCapitalization: TextCapitalization.sentences,
                    validator: (value) => InputValidators.requiredText(
                      value,
                      maxLength: 255,
                    ),
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
