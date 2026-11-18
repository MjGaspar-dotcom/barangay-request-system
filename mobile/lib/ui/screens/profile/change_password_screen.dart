import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import '../../../core/services/api_service.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/loading_button.dart';

class ChangePasswordScreen extends StatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmationController = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmationController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _saving = true);
    try {
      await ApiService.updatePassword({
        'current_password': _currentPasswordController.text,
        'new_password': _newPasswordController.text,
        'new_password_confirmation': _confirmationController.text,
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Password changed successfully.')),
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
      appBar: AppBar(title: const Text('Change password')),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              AppTextField(
                id: 'current_password',
                label: 'Current password',
                controller: _currentPasswordController,
                obscureText: true,
                validator: (value) => value == null || value.isEmpty
                    ? 'Enter your current password'
                    : null,
              ),
              const SizedBox(height: 12),
              AppTextField(
                id: 'new_password',
                label: 'New password',
                controller: _newPasswordController,
                obscureText: true,
                helperText: 'Use at least 8 characters.',
                validator: (value) => value == null || value.length < 8
                    ? 'Password must be at least 8 characters'
                    : null,
              ),
              const SizedBox(height: 12),
              AppTextField(
                id: 'confirm_new_password',
                label: 'Confirm new password',
                controller: _confirmationController,
                obscureText: true,
                validator: (value) => value != _newPasswordController.text
                    ? 'Passwords do not match'
                    : null,
              ),
              const SizedBox(height: 20),
              LoadingButton(
                id: 'save_password',
                label: 'Change password',
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
