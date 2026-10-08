import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/providers/auth_provider.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/loading_button.dart';
import 'login_screen.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  int _currentStep = 0;

  // Controllers
  final _usernameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmPasswordCtrl = TextEditingController();
  final _firstNameCtrl = TextEditingController();
  final _lastNameCtrl = TextEditingController();
  final _birthDateCtrl = TextEditingController();
  final _contactCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();

  String? _gender;
  String? _civilStatus;
  bool _obscurePwd = true;
  bool _obscureConfirm = true;

  final _genderOptions = ['Male', 'Female', 'Other'];
  final _civilOptions = ['Single', 'Married', 'Widowed', 'Separated'];

  @override
  void dispose() {
    for (final c in [
      _usernameCtrl, _emailCtrl, _passwordCtrl, _confirmPasswordCtrl,
      _firstNameCtrl, _lastNameCtrl, _birthDateCtrl, _contactCtrl, _addressCtrl
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(2000),
      firstDate: DateTime(1920),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      _birthDateCtrl.text =
          '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final success = await context.read<AuthProvider>().register({
      'username': _usernameCtrl.text.trim(),
      'email': _emailCtrl.text.trim(),
      'password': _passwordCtrl.text,
      'password_confirmation': _confirmPasswordCtrl.text,
      'first_name': _firstNameCtrl.text.trim(),
      'last_name': _lastNameCtrl.text.trim(),
      'birth_date': _birthDateCtrl.text,
      'gender': _gender,
      'civil_status': _civilStatus,
      'contact_number': _contactCtrl.text.trim(),
      'address': _addressCtrl.text.trim(),
    });

    if (!mounted) return;
    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Registration successful! Please log in.'),
          backgroundColor: Color(0xFF1A6B4A),
        ),
      );
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    } else {
      final msg = context.read<AuthProvider>().errorMessage;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(msg ?? 'Registration failed.')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final isLoading = auth.status == AuthStatus.loading;

    return Scaffold(
      backgroundColor: const Color(0xFFF5F8F6),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: const Color(0xFF1A6B4A),
        title: const Text(
          'Create Account',
          style: TextStyle(color: Color(0xFF1A2E1F)),
        ),
      ),
      body: Form(
        key: _formKey,
        child: Stepper(
          currentStep: _currentStep,
          onStepTapped: (step) => setState(() => _currentStep = step),
          onStepContinue: () {
            if (_currentStep < 1) {
              setState(() => _currentStep++);
            } else {
              _submit();
            }
          },
          onStepCancel: () {
            if (_currentStep > 0) setState(() => _currentStep--);
          },
          controlsBuilder: (context, details) {
            return Padding(
              padding: const EdgeInsets.only(top: 16),
              child: Row(
                children: [
                  Expanded(
                    child: LoadingButton(
                      id: 'btn_register_${_currentStep == 1 ? "submit" : "next"}',
                      label: _currentStep == 1 ? 'Register' : 'Next',
                      isLoading: isLoading && _currentStep == 1,
                      onPressed: details.onStepContinue!,
                    ),
                  ),
                  if (_currentStep > 0) ...[
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: details.onStepCancel,
                        child: const Text('Back'),
                      ),
                    ),
                  ],
                ],
              ),
            );
          },
          steps: [
            Step(
              title: const Text('Account Info'),
              isActive: _currentStep >= 0,
              state: _currentStep > 0 ? StepState.complete : StepState.indexed,
              content: Column(
                children: [
                  AppTextField(
                    id: 'reg_username',
                    label: 'Username',
                    controller: _usernameCtrl,
                    prefixIcon: Icons.person_outline,
                    validator: (v) =>
                        (v == null || v.isEmpty) ? 'Required' : null,
                  ),
                  const SizedBox(height: 12),
                  AppTextField(
                    id: 'reg_email',
                    label: 'Email',
                    controller: _emailCtrl,
                    prefixIcon: Icons.email_outlined,
                    keyboardType: TextInputType.emailAddress,
                    validator: (v) => (v == null || !v.contains('@'))
                        ? 'Valid email required'
                        : null,
                  ),
                  const SizedBox(height: 12),
                  AppTextField(
                    id: 'reg_password',
                    label: 'Password',
                    controller: _passwordCtrl,
                    prefixIcon: Icons.lock_outline,
                    obscureText: _obscurePwd,
                    suffixIcon: IconButton(
                      icon: Icon(_obscurePwd
                          ? Icons.visibility_off
                          : Icons.visibility),
                      onPressed: () =>
                          setState(() => _obscurePwd = !_obscurePwd),
                    ),
                    validator: (v) => (v == null || v.length < 8)
                        ? 'Min 8 characters'
                        : null,
                  ),
                  const SizedBox(height: 12),
                  AppTextField(
                    id: 'reg_confirm_password',
                    label: 'Confirm Password',
                    controller: _confirmPasswordCtrl,
                    prefixIcon: Icons.lock_outline,
                    obscureText: _obscureConfirm,
                    suffixIcon: IconButton(
                      icon: Icon(_obscureConfirm
                          ? Icons.visibility_off
                          : Icons.visibility),
                      onPressed: () =>
                          setState(() => _obscureConfirm = !_obscureConfirm),
                    ),
                    validator: (v) => v != _passwordCtrl.text
                        ? 'Passwords do not match'
                        : null,
                  ),
                ],
              ),
            ),
            Step(
              title: const Text('Personal Info'),
              isActive: _currentStep >= 1,
              content: Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: AppTextField(
                          id: 'reg_first_name',
                          label: 'First Name',
                          controller: _firstNameCtrl,
                          validator: (v) =>
                              (v == null || v.isEmpty) ? 'Required' : null,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: AppTextField(
                          id: 'reg_last_name',
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
                    id: 'reg_birth_date',
                    label: 'Birth Date',
                    controller: _birthDateCtrl,
                    prefixIcon: Icons.calendar_today,
                    readOnly: true,
                    onTap: _pickDate,
                    validator: (v) =>
                        (v == null || v.isEmpty) ? 'Required' : null,
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    key: const Key('reg_gender'),
                    value: _gender,
                    decoration: InputDecoration(
                      labelText: 'Gender',
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12)),
                      filled: true,
                      fillColor: const Color(0xFFF8FAF9),
                    ),
                    items: _genderOptions
                        .map((g) => DropdownMenuItem(value: g, child: Text(g)))
                        .toList(),
                    onChanged: (v) => setState(() => _gender = v),
                    validator: (v) => v == null ? 'Select gender' : null,
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    key: const Key('reg_civil_status'),
                    value: _civilStatus,
                    decoration: InputDecoration(
                      labelText: 'Civil Status',
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12)),
                      filled: true,
                      fillColor: const Color(0xFFF8FAF9),
                    ),
                    items: _civilOptions
                        .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                        .toList(),
                    onChanged: (v) => setState(() => _civilStatus = v),
                    validator: (v) => v == null ? 'Select civil status' : null,
                  ),
                  const SizedBox(height: 12),
                  AppTextField(
                    id: 'reg_contact',
                    label: 'Contact Number',
                    controller: _contactCtrl,
                    prefixIcon: Icons.phone_outlined,
                    keyboardType: TextInputType.phone,
                    validator: (v) =>
                        (v == null || v.isEmpty) ? 'Required' : null,
                  ),
                  const SizedBox(height: 12),
                  AppTextField(
                    id: 'reg_address',
                    label: 'Address',
                    controller: _addressCtrl,
                    prefixIcon: Icons.home_outlined,
                    maxLines: 2,
                    validator: (v) =>
                        (v == null || v.isEmpty) ? 'Required' : null,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
