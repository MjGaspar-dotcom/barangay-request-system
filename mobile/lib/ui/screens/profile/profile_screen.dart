import 'dart:io';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart';

import '../../../core/providers/auth_provider.dart';
import '../../../core/services/api_service.dart';
import '../../widgets/loading_button.dart';
import '../landing_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  File? _profilePic;
  File? _idFront;
  File? _idBack;
  bool _uploading = false;

  Future<void> _pickImage(Function(File) onPicked, ImageSource source) async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: source, imageQuality: 80);
    if (picked != null) onPicked(File(picked.path));
  }

  Future<void> _uploadProfile() async {
    if (_profilePic == null && _idFront == null && _idBack == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select at least one image.')),
      );
      return;
    }
    setState(() => _uploading = true);
    try {
      final formMap = <String, dynamic>{};
      if (_profilePic != null) {
        formMap['profile_picture'] = await MultipartFile.fromFile(
            _profilePic!.path,
            filename: 'profile.jpg');
      }
      if (_idFront != null) {
        formMap['valid_id_front'] = await MultipartFile.fromFile(_idFront!.path,
            filename: 'id_front.jpg');
      }
      if (_idBack != null) {
        formMap['valid_id_back'] = await MultipartFile.fromFile(_idBack!.path,
            filename: 'id_back.jpg');
      }
      await ApiService.updateProfile(FormData.fromMap(formMap));
      await context.read<AuthProvider>().refreshUser();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Profile updated successfully!'),
          backgroundColor: Color(0xFF1A6B4A),
        ),
      );
      setState(() {
        _profilePic = null;
        _idFront = null;
        _idBack = null;
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Upload failed. Please try again.')),
      );
    }
    if (mounted) setState(() => _uploading = false);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;

    return Scaffold(
      backgroundColor: const Color(0xFFF5F8F6),
      appBar: AppBar(
        title: const Text('My Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Logout',
            onPressed: () async {
              await auth.logout();
              if (context.mounted) {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const LandingScreen()),
                  (r) => false,
                );
              }
            },
          ),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            // Profile Header
            Center(
              child: Column(
                children: [
                  GestureDetector(
                    onTap: () => _pickImage(
                      (f) => setState(() => _profilePic = f),
                      ImageSource.gallery,
                    ),
                    child: Stack(
                      children: [
                        CircleAvatar(
                          radius: 52,
                          backgroundImage: _profilePic != null
                              ? FileImage(_profilePic!) as ImageProvider
                              : null,
                          backgroundColor:
                              const Color(0xFF1A6B4A).withOpacity(0.15),
                          child: _profilePic == null
                              ? Text(
                                  user?.firstName.isNotEmpty == true
                                      ? user!.firstName[0].toUpperCase()
                                      : '?',
                                  style: const TextStyle(
                                    fontSize: 36,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFF1A6B4A),
                                  ),
                                )
                              : null,
                        ),
                        Positioned(
                          bottom: 0,
                          right: 0,
                          child: Container(
                            padding: const EdgeInsets.all(6),
                            decoration: const BoxDecoration(
                              color: Color(0xFF1A6B4A),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.camera_alt,
                                color: Colors.white, size: 16),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    user?.fullName ?? '',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF1A2E1F),
                    ),
                  ),
                  Text(
                    '@${user?.username ?? ''}',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 8),
                  _VerificationBadge(
                      status: user?.verificationStatus ?? 'pending'),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Info Card
            _InfoCard(user: user),
            if (auth.errorMessage != null) ...[
              const SizedBox(height: 8),
              Text(
                'Could not refresh profile: ${auth.errorMessage}',
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
            ],
            const SizedBox(height: 20),

            // ID Upload Section
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Upload Valid ID',
                      style:
                          TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Upload your government-issued ID to verify your account.',
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: _IdUploadBox(
                            id: 'id_front_upload',
                            label: 'Front Side',
                            file: _idFront,
                            onTap: () => _pickImage(
                              (f) => setState(() => _idFront = f),
                              ImageSource.gallery,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _IdUploadBox(
                            id: 'id_back_upload',
                            label: 'Back Side',
                            file: _idBack,
                            onTap: () => _pickImage(
                              (f) => setState(() => _idBack = f),
                              ImageSource.gallery,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    LoadingButton(
                      id: 'btn_profile_upload',
                      label: 'Save Changes',
                      isLoading: _uploading,
                      onPressed: _uploadProfile,
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
}

class _VerificationBadge extends StatelessWidget {
  final String status;
  const _VerificationBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    final isVerified = status == 'verified';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: isVerified ? const Color(0xFFE6F3ED) : const Color(0xFFFFF3CD),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isVerified ? Icons.verified : Icons.pending_outlined,
            size: 14,
            color:
                isVerified ? const Color(0xFF1A6B4A) : const Color(0xFFB8860B),
          ),
          const SizedBox(width: 4),
          Text(
            isVerified ? 'Verified' : 'Pending Verification',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: isVerified
                  ? const Color(0xFF1A6B4A)
                  : const Color(0xFFB8860B),
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final dynamic user;
  const _InfoCard({required this.user});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Personal Information',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
            ),
            const SizedBox(height: 12),
            _InfoRow(icon: Icons.email_outlined, label: user?.email ?? '-'),
            _InfoRow(
                icon: Icons.phone_outlined, label: user?.contactNumber ?? '-'),
            _InfoRow(icon: Icons.home_outlined, label: user?.address ?? '-'),
            _InfoRow(icon: Icons.cake_outlined, label: user?.birthDate ?? '-'),
            _InfoRow(icon: Icons.person_outline, label: user?.gender ?? '-'),
            _InfoRow(
                icon: Icons.favorite_border, label: user?.civilStatus ?? '-'),
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  const _InfoRow({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 18, color: Colors.grey[500]),
          const SizedBox(width: 10),
          Text(label, style: TextStyle(fontSize: 14, color: Colors.grey[800])),
        ],
      ),
    );
  }
}

class _IdUploadBox extends StatelessWidget {
  final String id;
  final String label;
  final File? file;
  final VoidCallback onTap;
  const _IdUploadBox({
    required this.id,
    required this.label,
    required this.file,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        key: Key(id),
        height: 100,
        decoration: BoxDecoration(
          color: const Color(0xFFF0F5F2),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: file != null
                ? const Color(0xFF1A6B4A)
                : const Color(0xFFBBCCC4),
          ),
        ),
        child: file != null
            ? ClipRRect(
                borderRadius: BorderRadius.circular(11),
                child: Image.file(file!, fit: BoxFit.cover),
              )
            : Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.add_photo_alternate_outlined,
                      color: Color(0xFF1A6B4A)),
                  const SizedBox(height: 4),
                  Text(label,
                      style: const TextStyle(
                          fontSize: 12, color: Color(0xFF1A6B4A))),
                ],
              ),
      ),
    );
  }
}
