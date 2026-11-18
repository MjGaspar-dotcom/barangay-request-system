import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/providers/auth_provider.dart';
import '../../../core/services/api_service.dart';
import '../../../core/utils/input_validators.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/loading_button.dart';

class EditPersonalInfoScreen extends StatefulWidget {
  const EditPersonalInfoScreen({super.key});

  @override
  State<EditPersonalInfoScreen> createState() => _EditPersonalInfoScreenState();
}

class _EditPersonalInfoScreenState extends State<EditPersonalInfoScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _middleNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _contactNumberController = TextEditingController();
  final _addressController = TextEditingController();
  final _birthDateController = TextEditingController();
  String? _gender;
  String? _civilStatus;
  bool _saving = false;

  static const _genders = ['Male', 'Female', 'Prefer not to say'];
  static const _civilStatuses = [
    'Single',
    'Married',
    'Separated',
    'Divorced',
    'Widowed',
  ];

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthProvider>().user;
    _firstNameController.text = user?.firstName ?? '';
    _middleNameController.text = user?.middleName ?? '';
    _lastNameController.text = user?.lastName ?? '';
    _emailController.text = user?.email ?? '';
    _contactNumberController.text = user?.contactNumber ?? '';
    _addressController.text = user?.address ?? '';
    _birthDateController.text = user?.birthDate?.split('T').first ?? '';
    _gender = _genders.contains(user?.gender) ? user?.gender : null;
    _civilStatus =
        _civilStatuses.contains(user?.civilStatus) ? user?.civilStatus : null;
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _middleNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _contactNumberController.dispose();
    _addressController.dispose();
    _birthDateController.dispose();
    super.dispose();
  }

  Future<void> _pickBirthDate() async {
    final now = DateTime.now();
    final parsed = DateTime.tryParse(_birthDateController.text);
    final date = await showDatePicker(
      context: context,
      initialDate: parsed != null && !parsed.isAfter(now) ? parsed : now,
      firstDate: DateTime(1900),
      lastDate: now,
    );
    if (date != null) {
      _birthDateController.text = '${date.year.toString().padLeft(4, '0')}-'
          '${date.month.toString().padLeft(2, '0')}-'
          '${date.day.toString().padLeft(2, '0')}';
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _saving = true);
    try {
      final response = await ApiService.updateProfile(
        FormData.fromMap({
          'first_name': _firstNameController.text.trim(),
          'middle_name': _middleNameController.text.trim(),
          'last_name': _lastNameController.text.trim(),
          'email': _emailController.text.trim(),
          'contact_number': _contactNumberController.text.trim(),
          'address': _addressController.text.trim(),
          'birth_date': _birthDateController.text,
          'gender': _gender,
          'civil_status': _civilStatus,
        }),
      );
      if (!mounted) return;
      context.read<AuthProvider>().applyProfileUpdate(response.data);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Personal information updated.')),
      );
      Navigator.of(context).pop();
    } on DioException catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(ApiService.errorMessage(error))),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Personal information')),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              AppTextField(
                id: 'edit_first_name',
                label: 'First name',
                controller: _firstNameController,
                validator: (value) => InputValidators.requiredText(
                  value,
                  maxLength: 255,
                ),
              ),
              const SizedBox(height: 12),
              AppTextField(
                id: 'edit_middle_name',
                label: 'Middle name',
                controller: _middleNameController,
                maxLength: 255,
              ),
              const SizedBox(height: 12),
              AppTextField(
                id: 'edit_last_name',
                label: 'Last name',
                controller: _lastNameController,
                validator: (value) => InputValidators.requiredText(
                  value,
                  maxLength: 255,
                ),
              ),
              const SizedBox(height: 12),
              AppTextField(
                id: 'edit_email',
                label: 'Email',
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                validator: InputValidators.email,
              ),
              const SizedBox(height: 12),
              AppTextField(
                id: 'edit_contact_number',
                label: 'Contact number',
                controller: _contactNumberController,
                keyboardType: TextInputType.phone,
                validator: InputValidators.contactNumber,
              ),
              const SizedBox(height: 12),
              AppTextField(
                id: 'edit_address',
                label: 'Address',
                controller: _addressController,
                maxLength: 255,
                validator: (value) => InputValidators.requiredText(
                  value,
                  maxLength: 255,
                ),
              ),
              const SizedBox(height: 12),
              AppTextField(
                id: 'edit_birth_date',
                label: 'Birth date',
                controller: _birthDateController,
                readOnly: true,
                onTap: _pickBirthDate,
                prefixIcon: Icons.calendar_today_outlined,
                validator: (value) =>
                    (value == null || value.isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                key: const Key('edit_gender'),
                initialValue: _gender,
                isExpanded: true,
                decoration: const InputDecoration(labelText: 'Gender'),
                items: _genders
                    .map((value) =>
                        DropdownMenuItem(value: value, child: Text(value)))
                    .toList(),
                onChanged: (value) => setState(() => _gender = value),
                validator: (value) => value == null ? 'Select gender' : null,
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                key: const Key('edit_civil_status'),
                initialValue: _civilStatus,
                isExpanded: true,
                decoration: const InputDecoration(labelText: 'Civil status'),
                items: _civilStatuses
                    .map((value) =>
                        DropdownMenuItem(value: value, child: Text(value)))
                    .toList(),
                onChanged: (value) => setState(() => _civilStatus = value),
                validator: (value) =>
                    value == null ? 'Select civil status' : null,
              ),
              const SizedBox(height: 20),
              LoadingButton(
                id: 'save_personal_info',
                label: 'Save information',
                isLoading: _saving,
                onPressed: _save,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
