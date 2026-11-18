import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/models/notification_model.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/request_provider.dart';
import '../../../core/providers/notification_provider.dart';
import '../../../core/models/recommendation.dart';
import '../../../core/models/request_model.dart';
import '../../../core/models/user_model.dart';
import '../../../core/services/recommendation_engine.dart';
import '../../../core/theme/app_theme.dart';
import '../../widgets/status_chip.dart';
import '../../widgets/for_you_section.dart';
import '../landing_screen.dart';
import '../requests/my_requests_screen.dart';
import '../requests/create_request_screen.dart';
import '../notifications/notifications_screen.dart';
import '../profile/profile_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with WidgetsBindingObserver {
  int _selectedIndex = 0;
  Timer? _notificationPollingTimer;
  Timer? _requestPollingTimer;
  Timer? _birthdayRefreshTimer;
  final Set<int> _removedDocumentTypeIds = {};
  bool _isAppResumed = true;
  bool _redirectingForExpiredSession = false;
  bool _isCreateRequestOpen = false;
  AppNotification? _pendingNotification;
  late final AuthProvider _authProvider;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _authProvider = context.read<AuthProvider>();
    _authProvider.addListener(_onAuthChanged);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NotificationProvider>().resetForSession();
      context.read<RequestProvider>().fetchMyRequests();
      context.read<RequestProvider>().fetchDocumentTypes();
      unawaited(_refreshNotifications());
      _scheduleBirthdayRefresh(_authProvider.user?.birthDate);
    });
    _notificationPollingTimer = Timer.periodic(
      const Duration(minutes: 1),
      (_) {
        if (_isAppResumed) unawaited(_refreshNotifications());
      },
    );
    _requestPollingTimer = Timer.periodic(
      const Duration(seconds: 15),
      (_) {
        if (_isAppResumed && mounted) {
          unawaited(context.read<RequestProvider>().fetchMyRequests(
                silent: true,
              ));
        }
      },
    );
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final wasResumed = _isAppResumed;
    _isAppResumed = state == AppLifecycleState.resumed;
    if (_isAppResumed && !wasResumed) {
      unawaited(_refreshNotifications());
      _onAuthChanged();
      unawaited(
        context.read<RequestProvider>().fetchMyRequests(silent: true),
      );
      unawaited(
          context.read<RequestProvider>().fetchDocumentTypes(force: true));
    }
  }

  void _onAuthChanged() {
    if (_authProvider.sessionExpired && !_redirectingForExpiredSession) {
      _redirectingForExpiredSession = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted || !_authProvider.sessionExpired) {
          _redirectingForExpiredSession = false;
          return;
        }
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const LandingScreen()),
          (route) => false,
        );
      });
      return;
    }

    _scheduleBirthdayRefresh(_authProvider.user?.birthDate);
  }

  void _scheduleBirthdayRefresh(String? birthDate) {
    _birthdayRefreshTimer?.cancel();
    if (birthDate == null) return;

    final match = RegExp(r'^\d{4}-(\d{2})-(\d{2})').firstMatch(birthDate);
    if (match == null) return;

    final month = int.parse(match.group(1)!);
    final day = int.parse(match.group(2)!);
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    var nextBirthday = DateTime(now.year, month, day);
    if (!nextBirthday.isAfter(today)) {
      nextBirthday = DateTime(now.year + 1, month, day);
    }

    _birthdayRefreshTimer = Timer(nextBirthday.difference(now), () {
      if (!mounted) return;
      setState(() {});
      _scheduleBirthdayRefresh(_authProvider.user?.birthDate);
    });
  }

  Future<void> _refreshNotifications() async {
    final notification = await context.read<NotificationProvider>().fetch();
    if (!mounted || notification == null) return;

    if (_isCreateRequestOpen) {
      _pendingNotification = notification;
      return;
    }

    await _showNotification(notification);
  }

  Future<void> _showNotification(AppNotification notification) async {
    if (!mounted) return;

    final messenger = ScaffoldMessenger.of(context);
    var viewed = false;
    final controller = messenger.showMaterialBanner(
      MaterialBanner(
        leading: const Icon(
          Icons.notifications_active_outlined,
          color: AppColors.primaryContainer,
        ),
        content: Text(
          notification.message,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        backgroundColor: AppColors.darkSurface,
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
        elevation: 6,
        actions: [
          TextButton(
            onPressed: () {
              viewed = true;
              if (mounted) setState(() => _selectedIndex = 2);
              messenger.hideCurrentMaterialBanner();
            },
            child: const Text('View'),
          ),
        ],
      ),
    );
    final timeout = Timer(const Duration(seconds: 5), () {
      if (mounted && !viewed) messenger.hideCurrentMaterialBanner();
    });
    final closeReason = await controller.closed;
    timeout.cancel();
    if (!mounted || viewed || closeReason != MaterialBannerClosedReason.hide) {
      return;
    }

    final requestId = notification.requestId;
    final requestProvider = context.read<RequestProvider>();
    int? documentTypeId;
    if (requestId != null) {
      for (final request in requestProvider.requests) {
        if (request.id == requestId && request.documentType != null) {
          documentTypeId = request.documentType!.id;
          break;
        }
      }
    }
    if (documentTypeId == null) {
      final notificationText =
          '${notification.title} ${notification.message}'.toLowerCase();
      for (final documentType in requestProvider.documentTypes) {
        final documentName = documentType.name.trim().toLowerCase();
        if (documentName.isNotEmpty &&
            notificationText.contains(documentName)) {
          documentTypeId = documentType.id;
          break;
        }
      }
    }
    if (documentTypeId != null) {
      setState(() => _removedDocumentTypeIds.add(documentTypeId!));
    }
    await context.read<NotificationProvider>().dismiss(notification);
  }

  Future<void> _openCreateRequest({int? initialDocumentTypeId}) async {
    _isCreateRequestOpen = true;
    try {
      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => CreateRequestScreen(
            initialDocumentTypeId: initialDocumentTypeId,
          ),
        ),
      );
    } finally {
      if (mounted) {
        _isCreateRequestOpen = false;
        final notification = _pendingNotification;
        _pendingNotification = null;
        if (notification != null) unawaited(_showNotification(notification));
      }
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _authProvider.removeListener(_onAuthChanged);
    _notificationPollingTimer?.cancel();
    _requestPollingTimer?.cancel();
    _birthdayRefreshTimer?.cancel();
    super.dispose();
  }

  List<Widget> get _pages => [
        _DashboardTab(
          removedDocumentTypeIds: _removedDocumentTypeIds,
          onRequestDocument: _openCreateRequest,
        ),
        const MyRequestsScreen(),
        const NotificationsScreen(),
        const ProfileScreen(),
      ];

  @override
  Widget build(BuildContext context) {
    final notifProvider = context.watch<NotificationProvider>();

    return Scaffold(
      body: IndexedStack(index: _selectedIndex, children: _pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (i) {
          setState(() => _selectedIndex = i);
        },
        backgroundColor: AppColors.surface,
        indicatorColor: AppColors.primaryContainer,
        destinations: [
          const NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home, color: AppColors.primary),
            label: 'Home',
          ),
          const NavigationDestination(
            icon: Icon(Icons.folder_outlined),
            selectedIcon: Icon(Icons.folder, color: AppColors.primary),
            label: 'Requests',
          ),
          NavigationDestination(
            icon: Badge(
              isLabelVisible: notifProvider.unreadCount > 0,
              label: Text('${notifProvider.unreadCount}'),
              child: const Icon(Icons.notifications_outlined),
            ),
            selectedIcon:
                const Icon(Icons.notifications, color: AppColors.primary),
            label: 'Notifications',
          ),
          const NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person, color: AppColors.primary),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}

class _DashboardTab extends StatelessWidget {
  const _DashboardTab({
    this.removedDocumentTypeIds = const {},
    required this.onRequestDocument,
  });

  final Set<int> removedDocumentTypeIds;
  final Future<void> Function({int? initialDocumentTypeId}) onRequestDocument;
  static final _recommendationEngine = RecommendationEngine();

  // Display profile- and history-ranked documents below the resident greeting.
  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final requestProvider = context.watch<RequestProvider>();
    final user = auth.user;
    final showVerificationWarning = user != null && !user.isVerified;
    final activeDocumentTypes = requestProvider.documentTypes
        .where((documentType) =>
            documentType.isActive &&
            !removedDocumentTypeIds.contains(documentType.id))
        .toList(growable: false);
    final requestHistory = requestProvider.requests
        .where((request) => request.documentType != null)
        .map(
          (request) => ResidentRequest(
            documentType: request.documentType!.name,
            date: DateTime.tryParse(request.createdAt) ??
                DateTime.fromMillisecondsSinceEpoch(0),
          ),
        )
        .toList(growable: false);
    final List<DocumentType> recommendedDocuments = user == null
        ? const []
        : _recommendedDocuments(
            user: user,
            documentTypes: activeDocumentTypes,
            requestHistory: requestHistory,
          );

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppColors.primary, AppColors.primaryDark],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                padding: const EdgeInsets.fromLTRB(24, 24, 24, 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Good day,',
                              style: TextStyle(
                                color: AppColors.surface.withValues(alpha: 0.7),
                                fontSize: 14,
                              ),
                            ),
                            Text(
                              user?.firstName ?? 'Resident',
                              style: const TextStyle(
                                color: AppColors.surface,
                                fontSize: 24,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  children: [
                    // Verification Warning Card
                    if (showVerificationWarning)
                      _VerificationBanner(
                        onTap: () {
                          // Navigate to profile
                        },
                      ),

                    if (user != null) ...[
                      const SizedBox(height: 16),
                      ForYouSection(
                        recommendedDocuments: recommendedDocuments,
                        status: requestProvider.documentTypesStatus,
                        ageGroup: user.ageGroup?.label,
                        errorMessage: requestProvider.documentTypesError,
                        onRetry: () => unawaited(
                          context
                              .read<RequestProvider>()
                              .fetchDocumentTypes(force: true),
                        ),
                        onRequestDocument: (documentType) => onRequestDocument(
                          initialDocumentTypeId: documentType.id,
                        ),
                      ),
                    ],

                    const SizedBox(height: 16),

                    // Quick Actions
                    const _SectionHeader(title: 'Quick Actions'),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _QuickActionCard(
                            id: 'qa_request_document',
                            icon: Icons.add_circle_outline,
                            label: 'Request\nDocument',
                            color: AppColors.primary,
                            onTap: onRequestDocument,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _QuickActionCard(
                            id: 'qa_my_requests',
                            icon: Icons.folder_open_outlined,
                            label: 'My\nRequests',
                            color: AppColors.secondary,
                            onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) => const MyRequestsScreen()),
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // Recent Requests
                    const _SectionHeader(title: 'Recent Requests'),
                    const SizedBox(height: 12),
                    if (requestProvider.status == RequestStatus.loading)
                      const Center(child: CircularProgressIndicator())
                    else if (requestProvider.requests.isEmpty)
                      _EmptyRequests(
                        onRequest: onRequestDocument,
                      )
                    else
                      ...requestProvider.requests.take(3).map(
                            (r) => Padding(
                              padding: const EdgeInsets.only(bottom: 10),
                              child: _RequestCard(request: r),
                            ),
                          ),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<DocumentType> _recommendedDocuments({
    required AppUser user,
    required List<DocumentType> documentTypes,
    required List<ResidentRequest> requestHistory,
  }) {
    final byName = {
      for (final documentType in documentTypes)
        if (documentType.isEligibleForAge(user.age))
          documentType.name.trim().toLowerCase(): documentType,
    };
    final ranked = _recommendationEngine.recommend(
      resident: user,
      residents: const [],
      documentTypes: documentTypes,
      includeRequestHistory: false,
    );

    final recommendations = ranked
        .map((recommendation) =>
            byName[recommendation.documentType.trim().toLowerCase()])
        .whereType<DocumentType>()
        .toList(growable: false);

    return _recommendationEngine.orderForYouDocuments(
      residentAge: user.age,
      availableDocuments: documentTypes,
      requestHistory: requestHistory,
      profileRecommendations: recommendations,
    );
  }
}

class _VerificationBanner extends StatelessWidget {
  final VoidCallback onTap;
  const _VerificationBanner({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.warningContainer,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.warning),
        ),
        child: Row(
          children: [
            const Icon(Icons.warning_amber_rounded,
                color: AppColors.warning, size: 28),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Verification Pending',
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      color: AppColors.warningDark,
                    ),
                  ),
                  Text(
                    'Upload your Valid ID to verify your account and unlock full features.',
                    style: TextStyle(
                        fontSize: 12,
                        color: AppColors.warningDark.withValues(alpha: 0.8)),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: AppColors.warningDark),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 17,
          fontWeight: FontWeight.w700,
          color: AppColors.textPrimary,
        ),
      ),
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final String id;
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.id,
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        key: Key(id),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.3),
              offset: const Offset(0, 6),
              blurRadius: 16,
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: AppColors.surface, size: 32),
            const SizedBox(height: 12),
            Text(
              label,
              style: const TextStyle(
                color: AppColors.surface,
                fontWeight: FontWeight.w700,
                fontSize: 15,
                height: 1.3,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RequestCard extends StatelessWidget {
  final dynamic request;
  const _RequestCard({required this.request});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.description_outlined,
                color: AppColors.primary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  request.documentType?.name ?? 'Document',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  request.purpose,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          StatusChip(status: request.status),
        ],
      ),
    );
  }
}

class _EmptyRequests extends StatelessWidget {
  final VoidCallback onRequest;
  const _EmptyRequests({required this.onRequest});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          const Icon(
            Icons.inbox_outlined,
            size: 48,
            color: AppColors.textSubtle,
          ),
          const SizedBox(height: 12),
          const Text(
            'No requests yet',
            style: TextStyle(
              color: AppColors.textSecondary,
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: onRequest,
              child: const Text('Make a Request'),
            ),
          ),
        ],
      ),
    );
  }
}
