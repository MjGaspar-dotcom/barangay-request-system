import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
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
import '../../widgets/qr_receipt_dialog.dart';

class CreateRequestScreen extends StatefulWidget {
  const CreateRequestScreen({
    super.key,
    this.initialDocumentTypeId,
    this.guestMode = false,
  });

  final int? initialDocumentTypeId;
  final bool guestMode;

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
  final _numberOfChildrenCtrl = TextEditingController();
  final _guestFirstNameCtrl = TextEditingController();
  final _guestMiddleNameCtrl = TextEditingController();
  final _guestLastNameCtrl = TextEditingController();
  final _guestBirthDateCtrl = TextEditingController();
  final _guestContactCtrl = TextEditingController();
  final _guestStreetCtrl = TextEditingController();
  final _imagePicker = ImagePicker();
  final _recommendationEngine = RecommendationEngine();
  int? _selectedDocTypeId;
  String? _selectedPurpose;
  bool _guestNoMiddleName = false;
  XFile? _guestIdFront;
  XFile? _guestIdBack;
  String? _submissionError;
  bool _requestDetailsAutofilled = false;

  @override
  void initState() {
    super.initState();
    _selectedDocTypeId = widget.initialDocumentTypeId;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final requestProvider = context.read<RequestProvider>();
      requestProvider.fetchDocumentTypes();
      if (_selectedDocTypeId != null &&
          _fillMissingRequestDetails(_selectedDocTypeId!, requestProvider) &&
          mounted) {
        setState(() => _requestDetailsAutofilled = true);
      }
    });
  }

  @override
  void dispose() {
    _purposeCtrl.dispose();
    _businessNameCtrl.dispose();
    _businessAddressCtrl.dispose();
    _numberOfChildrenCtrl.dispose();
    _guestFirstNameCtrl.dispose();
    _guestMiddleNameCtrl.dispose();
    _guestLastNameCtrl.dispose();
    _guestBirthDateCtrl.dispose();
    _guestContactCtrl.dispose();
    _guestStreetCtrl.dispose();
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

  bool _requiresNumberOfChildren(RequestProvider provider) {
    for (final document in provider.documentTypes) {
      if (document.id == _selectedDocTypeId) {
        return document.name.trim().toLowerCase() ==
            'certificate of solo parent';
      }
    }
    return false;
  }

  bool _fillMissingRequestDetails(
    int documentTypeId,
    RequestProvider provider,
  ) {
    DocumentType? selectedDocument;
    for (final document in provider.documentTypes) {
      if (document.id == documentTypeId) {
        selectedDocument = document;
        break;
      }
    }
    var filledAnyField = false;
    void fillIfMissing(TextEditingController controller, String key) {
      final value = controller.text.trim();
      if (value.isNotEmpty) return;

      for (final request in provider.requests) {
        if (request.documentType?.id != documentTypeId) continue;
        final previousValue = request.requestData?[key]?.toString().trim();
        if (previousValue != null && previousValue.isNotEmpty) {
          controller.text = previousValue;
          filledAnyField = true;
          return;
        }
      }
    }

    final documentName = selectedDocument?.name.trim().toLowerCase();
    if (documentName == 'barangay business clearance') {
      fillIfMissing(_businessNameCtrl, 'business_name');
      fillIfMissing(_businessAddressCtrl, 'business_address');
    }
    return filledAnyField;
  }

  void _selectDocumentType(int? documentTypeId) {
    final requestProvider = context.read<RequestProvider>();
    final filled = documentTypeId != null &&
        _fillMissingRequestDetails(documentTypeId, requestProvider);
    setState(() {
      _selectedDocTypeId = documentTypeId;
      _requestDetailsAutofilled = filled;
    });
  }

  Future<void> _pickGuestIdImage(
    bool isFront,
    FormFieldState<bool> field,
  ) async {
    XFile? image;
    try {
      image = await _imagePicker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 85,
        maxWidth: 1800,
        maxHeight: 1800,
      );
    } on Exception catch (error) {
      debugPrint('Guest ID image picker failed: $error');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Could not open the photo picker. Please try again.'),
          ),
        );
      }
      return;
    }
    if (image == null || !mounted) return;
    setState(() {
      if (isFront) {
        _guestIdFront = image;
      } else {
        _guestIdBack = image;
      }
    });
    field.didChange(_guestIdFront != null && _guestIdBack != null);
  }

  Future<void> _pickGuestBirthDate() async {
    final today = DateTime.now();
    final selectedDate = DateTime.tryParse(_guestBirthDateCtrl.text);
    final picked = await showDatePicker(
      context: context,
      initialDate:
          selectedDate ?? DateTime(today.year - 18, today.month, today.day),
      firstDate: DateTime(1920),
      lastDate: DateTime(today.year, today.month, today.day),
    );
    if (picked == null || !mounted) return;
    _guestBirthDateCtrl.text =
        '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _submissionError = null);
    final requestProvider = context.read<RequestProvider>();
    Map<String, dynamic>? requestData;
    if (_requiresBusinessDetails(requestProvider)) {
      requestData = {
        'business_name': _businessNameCtrl.text.trim(),
        'business_address': _businessAddressCtrl.text.trim(),
      };
    } else if (_requiresNumberOfChildren(requestProvider)) {
      requestData = {
        'number_of_children': int.parse(_numberOfChildrenCtrl.text.trim()),
      };
    }
    final purpose = _selectedPurpose == 'Other'
        ? _purposeCtrl.text.trim()
        : _selectedPurpose!;
    final success = widget.guestMode
        ? await requestProvider.createGuestRequest(
            firstName: _guestFirstNameCtrl.text.trim(),
            middleName:
                _guestNoMiddleName ? null : _guestMiddleNameCtrl.text.trim(),
            noMiddleName: _guestNoMiddleName,
            lastName: _guestLastNameCtrl.text.trim(),
            birthDate: _guestBirthDateCtrl.text,
            contactNumber: _guestContactCtrl.text.trim(),
            streetName: _guestStreetCtrl.text.trim(),
            validIdFront: _guestIdFront!,
            validIdBack: _guestIdBack!,
            documentTypeId: _selectedDocTypeId!,
            purpose: purpose,
            requestDetails: requestData,
          )
        : await requestProvider.createRegisteredRequest(
            documentTypeId: _selectedDocTypeId!,
            purpose: purpose,
            requestDetails: requestData,
          );
    if (!mounted) return;
    if (success) {
      final request = requestProvider.lastCreatedRequest;
      final trackingNumber = request?.trackingNumber;
      if (request == null || trackingNumber == null) {
        setState(
          () => _submissionError =
              'Request submitted, but the server did not return a receipt.',
        );
        return;
      }

      String? documentName;
      for (final document in requestProvider.documentTypes) {
        if (document.id == _selectedDocTypeId) {
          documentName = document.name;
          break;
        }
      }

      await QrReceiptDialog.show(
        context,
        trackingNumber: trackingNumber,
        documentName: documentName,
      );
      if (!mounted) return;
      Navigator.of(context).pop();
    } else {
      final msg = context.read<RequestProvider>().errorMessage;
      setState(() => _submissionError = msg ?? 'Submission failed.');
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
      appBar: AppBar(
        title: Text(
          widget.guestMode ? 'Guest Document Request' : 'Request a Document',
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (widget.guestMode)
                  _buildGuestApplicantFields(isLoading)
                else
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
                          onPressed: () =>
                              _selectDocumentType(recommendedDocument!.id),
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
                  isExpanded: true,
                  decoration: InputDecoration(
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12)),
                    filled: true,
                    fillColor: const Color(0xFFF8FAF9),
                    hintText: 'Select document type',
                  ),
                  items: provider.documentTypes
                      .map(
                        (dt) => DropdownMenuItem(
                          value: dt.id,
                          child: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  dt.name,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              if (dt.processingTimeMinutes != null) ...[
                                const SizedBox(width: 12),
                                Text(
                                  '${dt.processingTimeMinutes} min',
                                  style: const TextStyle(
                                    color: AppColors.textSecondary,
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      )
                      .toList(),
                  onChanged: _selectDocumentType,
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
                  if (_requestDetailsAutofilled) ...[
                    const SizedBox(height: 4),
                    const Text(
                      'Some details were filled from your previous request. '
                      'Please review them before submitting.',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
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
                ],
                if (_requiresNumberOfChildren(provider)) ...[
                  const SizedBox(height: 24),
                  const Text(
                    'Solo Parent details',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                  ),
                  const SizedBox(height: 8),
                  AppTextField(
                    id: 'create_req_number_of_children',
                    label: 'Number of children',
                    controller: _numberOfChildrenCtrl,
                    keyboardType: TextInputType.number,
                    maxLength: 3,
                    validator: (value) {
                      final count = int.tryParse(value?.trim() ?? '');
                      if (count == null) return 'Enter a whole number';
                      if (count < 1) return 'Must be at least one';
                      return null;
                    },
                  ),
                ],
                const SizedBox(height: 32),
                if (_submissionError != null) ...[
                  Container(
                    key: const Key('create_req_submission_error'),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      _submissionError!,
                      style: const TextStyle(color: Colors.red),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
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

  Widget _buildGuestApplicantFields(bool isLoading) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Guest details',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
        ),
        const SizedBox(height: 8),
        const Text(
          'No account is needed. Your ID photos will be securely stored for staff review.',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
        ),
        const SizedBox(height: 16),
        AppTextField(
          id: 'guest_first_name',
          label: 'First name',
          controller: _guestFirstNameCtrl,
          textCapitalization: TextCapitalization.words,
          validator: (value) =>
              value == null || value.trim().isEmpty ? 'Required' : null,
        ),
        const SizedBox(height: 12),
        AppTextField(
          id: 'guest_middle_name',
          label: 'Middle name',
          controller: _guestMiddleNameCtrl,
          enabled: !isLoading && !_guestNoMiddleName,
          textCapitalization: TextCapitalization.words,
          validator: (value) =>
              _guestNoMiddleName || (value != null && value.trim().isNotEmpty)
                  ? null
                  : 'Enter your middle name or select the option below.',
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Checkbox(
              key: const Key('guest_no_middle_name'),
              value: _guestNoMiddleName,
              visualDensity: VisualDensity.compact,
              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
              onChanged: isLoading
                  ? null
                  : (value) {
                      setState(() {
                        _guestNoMiddleName = value ?? false;
                        if (_guestNoMiddleName) {
                          _guestMiddleNameCtrl.clear();
                        }
                      });
                    },
            ),
            const SizedBox(width: 4),
            const Expanded(
              child: Text('I do not have a middle name'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        AppTextField(
          id: 'guest_last_name',
          label: 'Last name',
          controller: _guestLastNameCtrl,
          textCapitalization: TextCapitalization.words,
          validator: (value) =>
              value == null || value.trim().isEmpty ? 'Required' : null,
        ),
        const SizedBox(height: 12),
        AppTextField(
          id: 'guest_birth_date',
          label: 'Birthday',
          controller: _guestBirthDateCtrl,
          enabled: !isLoading,
          readOnly: true,
          onTap: isLoading ? null : _pickGuestBirthDate,
          validator: (value) =>
              value == null || value.isEmpty ? 'Select your birthday' : null,
        ),
        const SizedBox(height: 12),
        AppTextField(
          id: 'guest_contact_number',
          label: 'Contact number',
          controller: _guestContactCtrl,
          keyboardType: TextInputType.phone,
          maxLength: 20,
          validator: InputValidators.contactNumber,
        ),
        const SizedBox(height: 12),
        AppTextField(
          id: 'guest_street_name',
          label: 'Street name',
          controller: _guestStreetCtrl,
          textCapitalization: TextCapitalization.words,
          validator: (value) =>
              value == null || value.trim().isEmpty ? 'Required' : null,
        ),
        const SizedBox(height: 12),
        FormField<bool>(
          key: const Key('guest_valid_id_photos'),
          validator: (_) => _guestIdFront != null && _guestIdBack != null
              ? null
              : 'Upload both the front and back of your ID.',
          builder: (field) => Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              OutlinedButton.icon(
                key: const Key('btn_guest_upload_id_front'),
                onPressed:
                    isLoading ? null : () => _pickGuestIdImage(true, field),
                icon: const Icon(Icons.upload_file),
                label: Text(
                  _guestIdFront == null
                      ? 'Upload front of ID'
                      : 'Front selected: ${_guestIdFront!.name}',
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              OutlinedButton.icon(
                key: const Key('btn_guest_upload_id_back'),
                onPressed:
                    isLoading ? null : () => _pickGuestIdImage(false, field),
                icon: const Icon(Icons.upload_file),
                label: Text(
                  _guestIdBack == null
                      ? 'Upload back of ID'
                      : 'Back selected: ${_guestIdBack!.name}',
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (field.errorText != null)
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    field.errorText!,
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.error,
                      fontSize: 12,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }
}
