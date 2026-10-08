import 'dart:io';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart';

import '../../../core/providers/request_provider.dart';
import '../../../core/services/api_service.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/document_types_error.dart';
import '../../widgets/loading_button.dart';
import 'guest_success_screen.dart';

class GuestRequestScreen extends StatefulWidget {
  const GuestRequestScreen({super.key});

  @override
  State<GuestRequestScreen> createState() => _GuestRequestScreenState();
}

class _GuestRequestScreenState extends State<GuestRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameCtrl = TextEditingController();
  final _middleNameCtrl = TextEditingController();
  final _lastNameCtrl = TextEditingController();
  final _birthDateCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _contactCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _purposeCtrl = TextEditingController();
  int? _selectedDocTypeId;
  String? _gender;
  String? _civilStatus;
  String? _validIdType;
  File? _idImage;
  bool _ocrLoading = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<RequestProvider>().fetchDocumentTypes();
    });
  }

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _middleNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _birthDateCtrl.dispose();
    _addressCtrl.dispose();
    _contactCtrl.dispose();
    _emailCtrl.dispose();
    _purposeCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 80,
      maxWidth: 2000,
      maxHeight: 2000,
    );
    if (pickedFile == null || !mounted) return;

    setState(() {
      _idImage = File(pickedFile.path);
      _ocrLoading = true;
    });

    try {
      final response = await ApiService.extractIdText(pickedFile.path);
      final data = response.data;
      final parsed = data is Map ? data['data'] : null;
      final birthDate = parsed is Map
          ? _normalizeBirthDate(parsed['birth_date']?.toString())
          : null;

      if (!mounted) return;
      if (birthDate != null) {
        _birthDateCtrl.text = birthDate;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Birth date read from your ID.')),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('ID selected. Enter your birth date manually.'),
          ),
        );
      }
    } on DioException catch (error) {
      if (!mounted) return;
      final data = error.response?.data;
      final message = data is Map && data['message'] != null
          ? data['message'].toString()
          : 'Could not read your ID. You can enter your details manually.';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message)),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not read your ID: $error')),
      );
    } finally {
      if (mounted) setState(() => _ocrLoading = false);
    }
  }

  String? _normalizeBirthDate(String? value) {
    if (value == null) return null;

    final trimmed = value.trim();
    final isoMatch = RegExp(r'^(\d{4})-(\d{2})-(\d{2})$').firstMatch(trimmed);
    final dmyMatch = RegExp(r'^(\d{2})-(\d{2})-(\d{4})$').firstMatch(trimmed);
    final year = isoMatch != null
        ? int.parse(isoMatch.group(1)!)
        : dmyMatch != null
            ? int.parse(dmyMatch.group(3)!)
            : null;
    final month = isoMatch != null
        ? int.parse(isoMatch.group(2)!)
        : dmyMatch != null
            ? int.parse(dmyMatch.group(2)!)
            : null;
    final day = isoMatch != null
        ? int.parse(isoMatch.group(3)!)
        : dmyMatch != null
            ? int.parse(dmyMatch.group(1)!)
            : null;

    if (year == null || month == null || day == null) return null;
    final date = DateTime(year, month, day);
    if (date.year != year ||
        date.month != month ||
        date.day != day ||
        date.isAfter(DateTime.now())) {
      return null;
    }

    return date.toIso8601String().split('T').first;
  }

  Future<void> _chooseBirthDate() async {
    final existingDate = DateTime.tryParse(_birthDateCtrl.text);
    final selectedDate = await showDatePicker(
      context: context,
      initialDate: existingDate ?? DateTime(2000),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
    );
    if (selectedDate == null) return;

    _birthDateCtrl.text = '${selectedDate.year.toString().padLeft(4, '0')}-'
        '${selectedDate.month.toString().padLeft(2, '0')}-'
        '${selectedDate.day.toString().padLeft(2, '0')}';
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);
    if (_idImage == null) {
      messenger.showSnackBar(
        const SnackBar(content: Text('Please upload your Valid ID.')),
      );
      return;
    }

    final idImage = _idImage!;
    final requestProvider = context.read<RequestProvider>();
    final formData = FormData.fromMap({
      'first_name': _firstNameCtrl.text.trim(),
      'middle_name': _middleNameCtrl.text.trim().isEmpty
          ? null
          : _middleNameCtrl.text.trim(),
      'last_name': _lastNameCtrl.text.trim(),
      'birth_date': _birthDateCtrl.text.trim(),
      'gender': _gender,
      'civil_status': _civilStatus,
      'address': _addressCtrl.text.trim(),
      'contact_number': _contactCtrl.text.trim(),
      'email': _emailCtrl.text.trim().isEmpty ? null : _emailCtrl.text.trim(),
      'valid_id_type': _validIdType,
      'document_type_id': _selectedDocTypeId,
      'purpose': _purposeCtrl.text.trim(),
      'valid_id_image': await MultipartFile.fromFile(
        idImage.path,
        filename: idImage.path.split(Platform.pathSeparator).last,
      ),
    });

    final trackingNumber = await requestProvider.createGuestRequest(formData);

    if (!mounted) return;
    if (trackingNumber != null) {
      navigator.pushReplacement(
        MaterialPageRoute(
          builder: (_) => GuestSuccessScreen(
            trackingNumber: trackingNumber,
            qrPayload: requestProvider.lastQrPayload ??
                ApiService.trackingUrl(trackingNumber),
          ),
        ),
      );
    } else {
      final msg = requestProvider.errorMessage;
      messenger.showSnackBar(
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
      appBar: AppBar(title: const Text('Guest Request')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Your Information',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1A2E1F),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'No account needed. Fill in your details below.',
                  style: TextStyle(fontSize: 13, color: Colors.grey[600]),
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: AppTextField(
                        id: 'guest_first_name',
                        label: 'First Name',
                        controller: _firstNameCtrl,
                        validator: (v) =>
                            (v == null || v.isEmpty) ? 'Required' : null,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: AppTextField(
                        id: 'guest_last_name',
                        label: 'Last Name',
                        controller: _lastNameCtrl,
                        validator: (v) =>
                            (v == null || v.isEmpty) ? 'Required' : null,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                AppTextField(
                  id: 'guest_middle_name',
                  label: 'Middle Name (optional)',
                  controller: _middleNameCtrl,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  key: const Key('guest_birth_date'),
                  controller: _birthDateCtrl,
                  readOnly: true,
                  onTap: _chooseBirthDate,
                  decoration: InputDecoration(
                    labelText: 'Date of Birth',
                    hintText: 'YYYY-MM-DD',
                    prefixIcon: const Icon(Icons.calendar_today_outlined),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    filled: true,
                    fillColor: const Color(0xFFF8FAF9),
                  ),
                  validator: (value) {
                    if (value == null || DateTime.tryParse(value) == null) {
                      return 'Please enter your date of birth';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  key: const Key('guest_gender'),
                  initialValue: _gender,
                  decoration: InputDecoration(
                    labelText: 'Gender',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    filled: true,
                    fillColor: const Color(0xFFF8FAF9),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'Male', child: Text('Male')),
                    DropdownMenuItem(value: 'Female', child: Text('Female')),
                    DropdownMenuItem(
                      value: 'Prefer not to say',
                      child: Text('Prefer not to say'),
                    ),
                  ],
                  onChanged: (value) => setState(() => _gender = value),
                  validator: (value) =>
                      value == null ? 'Please select your gender' : null,
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  key: const Key('guest_civil_status'),
                  initialValue: _civilStatus,
                  decoration: InputDecoration(
                    labelText: 'Civil Status',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    filled: true,
                    fillColor: const Color(0xFFF8FAF9),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'Single', child: Text('Single')),
                    DropdownMenuItem(value: 'Married', child: Text('Married')),
                    DropdownMenuItem(value: 'Widowed', child: Text('Widowed')),
                    DropdownMenuItem(
                      value: 'Separated',
                      child: Text('Separated'),
                    ),
                  ],
                  onChanged: (value) => setState(() => _civilStatus = value),
                  validator: (value) =>
                      value == null ? 'Please select your civil status' : null,
                ),
                const SizedBox(height: 16),
                AppTextField(
                  id: 'guest_contact',
                  label: 'Contact Number',
                  controller: _contactCtrl,
                  prefixIcon: Icons.phone_outlined,
                  keyboardType: TextInputType.phone,
                  validator: (v) =>
                      (v == null || v.isEmpty) ? 'Required' : null,
                ),
                const SizedBox(height: 12),
                AppTextField(
                  id: 'guest_address',
                  label: 'Complete Address',
                  controller: _addressCtrl,
                  maxLines: 2,
                  validator: (value) => (value == null || value.isEmpty)
                      ? 'Address is required'
                      : null,
                ),
                const SizedBox(height: 12),
                AppTextField(
                  id: 'guest_email',
                  label: 'Email (optional)',
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: 24),
                const Text(
                  'Request Details',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1A2E1F),
                  ),
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<int>(
                  key: const Key('guest_doc_type'),
                  initialValue: _selectedDocTypeId,
                  decoration: InputDecoration(
                    labelText: 'Document Type',
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12)),
                    filled: true,
                    fillColor: const Color(0xFFF8FAF9),
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
                const SizedBox(height: 16),
                AppTextField(
                  id: 'guest_purpose',
                  label: 'Purpose',
                  controller: _purposeCtrl,
                  maxLines: 3,
                  validator: (v) =>
                      (v == null || v.isEmpty) ? 'Purpose is required' : null,
                ),
                const SizedBox(height: 24),
                const Text(
                  'Valid ID Upload',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1A2E1F),
                  ),
                ),
                DropdownButtonFormField<String>(
                  key: const Key('guest_valid_id_type'),
                  initialValue: _validIdType,
                  decoration: InputDecoration(
                    labelText: 'ID Type',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    filled: true,
                    fillColor: const Color(0xFFF8FAF9),
                  ),
                  items: const [
                    DropdownMenuItem(
                      value: 'National ID',
                      child: Text('National ID'),
                    ),
                    DropdownMenuItem(
                      value: 'Passport',
                      child: Text('Passport'),
                    ),
                    DropdownMenuItem(
                      value: "Driver's License",
                      child: Text("Driver's License"),
                    ),
                    DropdownMenuItem(value: 'UMID', child: Text('UMID')),
                    DropdownMenuItem(
                      value: "Voter's ID",
                      child: Text("Voter's ID"),
                    ),
                    DropdownMenuItem(
                      value: 'PhilHealth ID',
                      child: Text('PhilHealth ID'),
                    ),
                    DropdownMenuItem(
                      value: 'Barangay ID',
                      child: Text('Barangay ID'),
                    ),
                    DropdownMenuItem(value: 'Other', child: Text('Other')),
                  ],
                  onChanged: (value) => setState(() => _validIdType = value),
                  validator: (value) =>
                      value == null ? 'Please select your ID type' : null,
                ),
                const SizedBox(height: 12),
                if (_ocrLoading) ...[
                  const SizedBox(height: 8),
                  const Row(
                    children: [
                      SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                      SizedBox(width: 8),
                      Text('Reading ID details...'),
                    ],
                  ),
                ],
                const SizedBox(height: 12),
                GestureDetector(
                  onTap: _pickImage,
                  child: Container(
                    key: const Key('guest_id_upload'),
                    width: double.infinity,
                    height: _idImage != null ? null : 140,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF0F5F2),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: _idImage != null
                            ? const Color(0xFF1A6B4A)
                            : const Color(0xFFBBCCC4),
                        style: BorderStyle.solid,
                        width: 1.5,
                      ),
                    ),
                    child: _idImage != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(13),
                            child: Stack(
                              children: [
                                Image.file(_idImage!,
                                    width: double.infinity, fit: BoxFit.cover),
                                Positioned(
                                  top: 8,
                                  right: 8,
                                  child: GestureDetector(
                                    onTap: _pickImage,
                                    child: Container(
                                      padding: const EdgeInsets.all(6),
                                      decoration: BoxDecoration(
                                        color: Colors.black54,
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: const Icon(Icons.edit,
                                          color: Colors.white, size: 16),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          )
                        : Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.upload_file,
                                  size: 36, color: Color(0xFF1A6B4A)),
                              const SizedBox(height: 8),
                              const Text(
                                'Tap to upload Valid ID',
                                style: TextStyle(
                                  color: Color(0xFF1A6B4A),
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'JPEG, PNG supported',
                                style: TextStyle(
                                    fontSize: 12, color: Colors.grey[500]),
                              ),
                            ],
                          ),
                  ),
                ),
                const SizedBox(height: 32),
                LoadingButton(
                  id: 'btn_guest_submit',
                  label: 'Submit Request',
                  isLoading: isLoading,
                  onPressed: _submit,
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
