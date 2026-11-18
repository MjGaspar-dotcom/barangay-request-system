import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/providers/auth_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/input_validators.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/google_sign_in_button.dart';
import '../../widgets/loading_button.dart';
import '../home/home_screen.dart';
import 'login_screen.dart';

class RegisterScreen extends StatefulWidget {
  final String? googleIdToken;
  final String? googleEmail;
  final String? googleFirstName;
  final String? googleLastName;

  const RegisterScreen({
    super.key,
    this.googleIdToken,
    this.googleEmail,
    this.googleFirstName,
    this.googleLastName,
  });

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  static const _barangay = 'Barangay Aurora';
  static const _municipality = 'Alicia';
  static const _province = 'Isabela';
  static const _postalCode = '3306';

  final _accountFormKey = GlobalKey<FormState>();
  final _personalFormKey = GlobalKey<FormState>();
  int _currentStep = 0;

  // Controllers
  final _usernameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmPasswordCtrl = TextEditingController();
  final _firstNameCtrl = TextEditingController();
  final _middleNameCtrl = TextEditingController();
  final _lastNameCtrl = TextEditingController();
  final _birthDateCtrl = TextEditingController();
  final _contactCtrl = TextEditingController();
  final _streetNameCtrl = TextEditingController();
  final _barangayNameCtrl = TextEditingController(text: _barangay);
  final _municipalityCtrl = TextEditingController(text: _municipality);
  final _provinceCtrl = TextEditingController(text: _province);
  final _postalCodeCtrl = TextEditingController(text: _postalCode);

  String? _gender;
  String? _civilStatus;
  bool _hasNoMiddleName = false;
  bool _obscurePwd = true;
  bool _obscureConfirm = true;
  String? _googleIdToken;

  final _genderOptions = ['Male', 'Female', 'Prefer not to say'];
  final _civilOptions = ['Single', 'Married', 'Widowed', 'Separated'];

  @override
  void initState() {
    super.initState();
    _googleIdToken = widget.googleIdToken;
    if (_googleIdToken != null) {
      _currentStep = 1;
      _emailCtrl.text = widget.googleEmail ?? '';
      _firstNameCtrl.text = widget.googleFirstName ?? '';
      _lastNameCtrl.text = widget.googleLastName ?? '';
    }
  }

  @override
  void dispose() {
    for (final c in [
      _usernameCtrl,
      _emailCtrl,
      _passwordCtrl,
      _confirmPasswordCtrl,
      _firstNameCtrl,
      _middleNameCtrl,
      _lastNameCtrl,
      _birthDateCtrl,
      _contactCtrl,
      _streetNameCtrl,
      _barangayNameCtrl,
      _municipalityCtrl,
      _provinceCtrl,
      _postalCodeCtrl,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  String get _formattedAddress => [
        _streetNameCtrl.text.trim(),
        _barangay,
        _municipality,
        _province,
        _postalCode,
      ].join(', ');

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
    if (!(_personalFormKey.currentState?.validate() ?? false)) return;
    final provider = context.read<AuthProvider>();
    final success = _googleIdToken != null
        ? await provider.completeGoogleSignUp(
            idToken: _googleIdToken!,
            profile: {
              'first_name': _firstNameCtrl.text.trim(),
              'middle_name':
                  _hasNoMiddleName || _middleNameCtrl.text.trim().isEmpty
                      ? null
                      : _middleNameCtrl.text.trim(),
              'last_name': _lastNameCtrl.text.trim(),
              'birth_date': _birthDateCtrl.text,
              'gender': _gender,
              'civil_status': _civilStatus,
              'contact_number': _contactCtrl.text.trim(),
              'street_name': _streetNameCtrl.text.trim(),
              'address': _formattedAddress,
            },
          )
        : await provider.register({
            'username': _usernameCtrl.text.trim(),
            'email': _emailCtrl.text.trim(),
            'password': _passwordCtrl.text,
            'password_confirmation': _confirmPasswordCtrl.text,
            'first_name': _firstNameCtrl.text.trim(),
            'middle_name':
                _hasNoMiddleName || _middleNameCtrl.text.trim().isEmpty
                    ? null
                    : _middleNameCtrl.text.trim(),
            'last_name': _lastNameCtrl.text.trim(),
            'birth_date': _birthDateCtrl.text,
            'gender': _gender,
            'civil_status': _civilStatus,
            'contact_number': _contactCtrl.text.trim(),
            'street_name': _streetNameCtrl.text.trim(),
            'address': _formattedAddress,
          });

    if (!mounted) return;
    if (success) {
      if (_googleIdToken != null) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const HomeScreen()),
          (route) => false,
        );
        return;
      }
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

  void _continueStep() {
    if (_currentStep == 0) {
      if (!(_accountFormKey.currentState?.validate() ?? false)) return;
      setState(() => _currentStep = 1);
      return;
    }

    _submit();
  }

  Future<void> _continueWithGoogle() async {
    final provider = context.read<AuthProvider>();
    final result = await provider.signInWithGoogle();
    if (!mounted) return;

    if (result == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            provider.errorMessage ?? 'Google sign-in was cancelled.',
          ),
        ),
      );
      return;
    }

    if (result.requiresProfile) {
      setState(() {
        _googleIdToken = result.idToken;
        _emailCtrl.text = result.email ?? '';
        _firstNameCtrl.text = result.firstName ?? '';
        _lastNameCtrl.text = result.lastName ?? '';
        _currentStep = 1;
      });
      return;
    }

    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const HomeScreen()),
      (route) => false,
    );
  }

  Widget _buildStepIndicator() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Step ${_currentStep + 1} of 2',
            key: const Key('register_step_indicator'),
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: _currentStep == 0 ? 0.5 : 1,
              minHeight: 5,
              backgroundColor: AppColors.primaryContainer,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAccountForm(bool isLoading) {
    return Form(
      key: _accountFormKey,
      child: Column(
        children: [
          if (_googleIdToken == null) ...[
            AppTextField(
              id: 'reg_username',
              label: 'Username',
              controller: _usernameCtrl,
              prefixIcon: Icons.person_outline,
              maxLength: 255,
              validator: InputValidators.username,
            ),
            const SizedBox(height: 12),
            AppTextField(
              id: 'reg_email',
              label: 'Email',
              controller: _emailCtrl,
              prefixIcon: Icons.email_outlined,
              keyboardType: TextInputType.emailAddress,
              maxLength: 255,
              validator: (value) => InputValidators.email(
                value,
                requiredMessage: 'Valid email required',
              ),
            ),
            const SizedBox(height: 12),
            AppTextField(
              id: 'reg_password',
              label: 'Password',
              controller: _passwordCtrl,
              prefixIcon: Icons.lock_outline,
              obscureText: _obscurePwd,
              suffixIcon: IconButton(
                icon: Icon(
                  _obscurePwd ? Icons.visibility_off : Icons.visibility,
                ),
                onPressed: () => setState(() => _obscurePwd = !_obscurePwd),
              ),
              validator: (value) => (value == null || value.length < 8)
                  ? 'Password must be at least 8 characters'
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
                icon: Icon(
                  _obscureConfirm ? Icons.visibility_off : Icons.visibility,
                ),
                onPressed: () =>
                    setState(() => _obscureConfirm = !_obscureConfirm),
              ),
              validator: (value) =>
                  value != _passwordCtrl.text ? 'Passwords do not match' : null,
            ),
            const SizedBox(height: 20),
            const Row(
              children: [
                Expanded(child: Divider()),
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 12),
                  child: Text(
                    'OR',
                    style: TextStyle(color: AppColors.textSecondary),
                  ),
                ),
                Expanded(child: Divider()),
              ],
            ),
            const SizedBox(height: 16),
            GoogleSignInButton(
              buttonKey: const Key('btn_register_with_google'),
              onPressed: isLoading ? null : _continueWithGoogle,
            ),
          ] else ...[
            Card(
              child: ListTile(
                leading: const Icon(
                  Icons.verified_user_outlined,
                  color: AppColors.primary,
                ),
                title: const Text('Google account connected'),
                subtitle: Text(_emailCtrl.text),
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Complete your resident details to finish creating your account.',
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildPersonalForm() {
    return Form(
      key: _personalFormKey,
      child: Column(
        children: [
          LayoutBuilder(
            builder: (context, constraints) {
              final firstNameField = AppTextField(
                id: 'reg_first_name',
                label: 'First Name',
                controller: _firstNameCtrl,
                validator: (value) =>
                    (value == null || value.isEmpty) ? 'Required' : null,
              );
              final lastNameField = AppTextField(
                id: 'reg_last_name',
                label: 'Last Name',
                controller: _lastNameCtrl,
                validator: (value) =>
                    (value == null || value.isEmpty) ? 'Required' : null,
              );

              if (constraints.maxWidth < 360) {
                return Column(
                  children: [
                    firstNameField,
                    const SizedBox(height: 12),
                    lastNameField,
                  ],
                );
              }

              return Row(
                children: [
                  Expanded(child: firstNameField),
                  const SizedBox(width: 12),
                  Expanded(child: lastNameField),
                ],
              );
            },
          ),
          const SizedBox(height: 12),
          AppTextField(
            id: 'reg_middle_name',
            label: 'Middle Name',
            controller: _middleNameCtrl,
            enabled: !_hasNoMiddleName,
          ),
          CheckboxListTile(
            key: const Key('reg_no_middle_name'),
            contentPadding: EdgeInsets.zero,
            controlAffinity: ListTileControlAffinity.leading,
            title: const Text('I have no Middle name'),
            value: _hasNoMiddleName,
            onChanged: (value) {
              setState(() {
                _hasNoMiddleName = value ?? false;
                if (_hasNoMiddleName) _middleNameCtrl.clear();
              });
            },
          ),
          const SizedBox(height: 12),
          AppTextField(
            id: 'reg_birth_date',
            label: 'Birth Date',
            controller: _birthDateCtrl,
            prefixIcon: Icons.calendar_today,
            readOnly: true,
            onTap: _pickDate,
            validator: (value) =>
                (value == null || value.isEmpty) ? 'Required' : null,
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            key: const Key('reg_gender'),
            initialValue: _gender,
            isExpanded: true,
            decoration: const InputDecoration(labelText: 'Gender'),
            items: _genderOptions
                .map((gender) =>
                    DropdownMenuItem(value: gender, child: Text(gender)))
                .toList(),
            onChanged: (value) => setState(() => _gender = value),
            validator: (value) => value == null ? 'Select gender' : null,
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            key: const Key('reg_civil_status'),
            initialValue: _civilStatus,
            isExpanded: true,
            decoration: const InputDecoration(labelText: 'Civil Status'),
            items: _civilOptions
                .map((status) =>
                    DropdownMenuItem(value: status, child: Text(status)))
                .toList(),
            onChanged: (value) => setState(() => _civilStatus = value),
            validator: (value) => value == null ? 'Select civil status' : null,
          ),
          const SizedBox(height: 12),
          AppTextField(
            id: 'reg_contact',
            label: 'Contact Number',
            controller: _contactCtrl,
            prefixIcon: Icons.phone_outlined,
            keyboardType: TextInputType.phone,
            maxLength: 20,
            validator: InputValidators.contactNumber,
          ),
          const SizedBox(height: 12),
          AppTextField(
            id: 'reg_street_name',
            label: 'Street Name',
            controller: _streetNameCtrl,
            prefixIcon: Icons.home_outlined,
            validator: (value) =>
                (value == null || value.trim().isEmpty) ? 'Required' : null,
          ),
          const SizedBox(height: 12),
          AppTextField(
            id: 'reg_barangay_name',
            label: 'Barangay Name',
            controller: _barangayNameCtrl,
            readOnly: true,
          ),
          const SizedBox(height: 12),
          AppTextField(
            id: 'reg_municipality',
            label: 'Municipality',
            controller: _municipalityCtrl,
            readOnly: true,
          ),
          const SizedBox(height: 12),
          AppTextField(
            id: 'reg_province',
            label: 'Province',
            controller: _provinceCtrl,
            readOnly: true,
          ),
          const SizedBox(height: 12),
          AppTextField(
            id: 'reg_postal_code',
            label: 'Postal Code',
            controller: _postalCodeCtrl,
            readOnly: true,
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final isLoading = auth.status == AuthStatus.loading;
    final isAccountStep = _currentStep == 0;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Create Account')),
      body: SafeArea(
        child: Column(
          children: [
            _buildStepIndicator(),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      isAccountStep ? 'Account details' : 'Personal details',
                      style:
                          Theme.of(context).textTheme.headlineSmall?.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      isAccountStep
                          ? 'Set up the account you will use to access barangay services.'
                          : 'Add your resident information to complete registration.',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.textSecondary,
                          ),
                    ),
                    const SizedBox(height: 16),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            _buildAccountStepTitle(isAccountStep),
                            const SizedBox(height: 16),
                            if (!isAccountStep && _googleIdToken != null) ...[
                              Card(
                                child: ListTile(
                                  leading: const Icon(
                                    Icons.verified_user_outlined,
                                    color: AppColors.primary,
                                  ),
                                  title: const Text(
                                    'Google account connected',
                                  ),
                                  subtitle: Text(_emailCtrl.text),
                                ),
                              ),
                              const SizedBox(height: 16),
                            ],
                            if (isAccountStep)
                              _buildAccountForm(isLoading)
                            else
                              _buildPersonalForm(),
                            const SizedBox(height: 20),
                            Row(
                              children: [
                                if (!isAccountStep) ...[
                                  Expanded(
                                    child: OutlinedButton(
                                      onPressed: () => setState(
                                        () => _currentStep = 0,
                                      ),
                                      child: const Text('Back'),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                ],
                                Expanded(
                                  child: LoadingButton(
                                    id: isAccountStep
                                        ? 'btn_register_next'
                                        : 'btn_register_submit',
                                    label: isAccountStep ? 'Next' : 'Register',
                                    isLoading: isLoading,
                                    onPressed: _continueStep,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAccountStepTitle(bool isAccountStep) {
    return Text(
      isAccountStep ? 'Create your login' : 'Your information',
      style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
    );
  }
}
