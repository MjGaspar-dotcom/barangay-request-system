import 'dart:io';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart';

import '../../../core/providers/request_provider.dart';
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
  final _lastNameCtrl = TextEditingController();
  final _contactCtrl = TextEditingController();
  final _purposeCtrl = TextEditingController();
  int? _selectedDocTypeId;
  File? _idImage;

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
    _lastNameCtrl.dispose();
    _contactCtrl.dispose();
    _purposeCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile =
        await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (pickedFile != null) {
      setState(() => _idImage = File(pickedFile.path));
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_idImage == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please upload your Valid ID.')),
      );
      return;
    }

    final formData = FormData.fromMap({
      'first_name': _firstNameCtrl.text.trim(),
      'last_name': _lastNameCtrl.text.trim(),
      'contact_number': _contactCtrl.text.trim(),
      'document_type_id': _selectedDocTypeId,
      'purpose': _purposeCtrl.text.trim(),
      'valid_id_image': await MultipartFile.fromFile(
        _idImage!.path,
        filename: 'valid_id.jpg',
      ),
    });

    final trackingNumber =
        await context.read<RequestProvider>().createGuestRequest(formData);

    if (!mounted) return;
    if (trackingNumber != null) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => GuestSuccessScreen(trackingNumber: trackingNumber),
        ),
      );
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
                  value: _selectedDocTypeId,
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
