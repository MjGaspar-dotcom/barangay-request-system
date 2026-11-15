import 'package:flutter/material.dart';
import 'package:dio/dio.dart';

import '../models/user_model.dart';
import '../services/api_service.dart';
import '../services/google_sign_in_service.dart';
import '../services/storage_service.dart';

enum AuthStatus { initial, loading, authenticated, unauthenticated, error }

class GoogleAuthResult {
  final bool requiresProfile;
  final String? idToken;
  final String? email;
  final String? firstName;
  final String? lastName;

  const GoogleAuthResult({
    this.requiresProfile = false,
    this.idToken,
    this.email,
    this.firstName,
    this.lastName,
  });
}

class AuthProvider extends ChangeNotifier {
  AuthProvider() {
    ApiService.onUnauthorized = _unauthorizedHandler;
  }

  AuthStatus _status = AuthStatus.initial;
  AppUser? _user;
  String? _errorMessage;
  bool _sessionExpired = false;
  final GoogleSignInService _googleSignInService = GoogleSignInService();
  late final void Function() _unauthorizedHandler = _handleUnauthorized;

  AuthStatus get status => _status;
  AppUser? get user => _user;
  String? get errorMessage => _errorMessage;
  bool get sessionExpired => _sessionExpired;
  bool get isAuthenticated => _status == AuthStatus.authenticated;

  Future<void> tryAutoLogin() async {
    final token = await StorageService.getToken();
    if (token == null || token.isEmpty) {
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return;
    }
    _status = AuthStatus.loading;
    notifyListeners();
    try {
      final response = await ApiService.getUser();
      _user = AppUser.fromJson(_userDataFromResponse(response.data));
      _status = AuthStatus.authenticated;
    } on DioException catch (error) {
      _errorMessage = ApiService.errorMessage(error);
      if (error.response?.statusCode == 401) {
        await StorageService.clearToken();
      }
      _status = AuthStatus.unauthenticated;
    } on FormatException catch (error) {
      _errorMessage = error.message;
      _status = AuthStatus.error;
    }
    notifyListeners();
  }

  Future<bool> login(String username, String password) async {
    _status = AuthStatus.loading;
    _errorMessage = null;
    _sessionExpired = false;
    notifyListeners();
    try {
      final response = await ApiService.login(username, password);
      final data = response.data;
      await StorageService.saveToken(data['token']);
      if (data['role'] != null) {
        await StorageService.saveRole(data['role']);
      }
      _user = AppUser.fromJson(_userDataFromResponse(data));
      _status = AuthStatus.authenticated;
      _errorMessage = null;
      notifyListeners();
      return true;
    } on DioException catch (e) {
      _errorMessage = _extractError(e);
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return false;
    }
  }

  Future<GoogleAuthResult?> signInWithGoogle() async {
    _status = AuthStatus.loading;
    _errorMessage = null;
    notifyListeners();

    try {
      final idToken = await _googleSignInService.signInAndGetIdToken();
      if (idToken == null) {
        _status = AuthStatus.unauthenticated;
        notifyListeners();
        return null;
      }

      final response = await ApiService.googleAuth({'id_token': idToken});
      return _handleGoogleAuthResponse(response.data, idToken: idToken);
    } on DioException catch (e) {
      _errorMessage = _extractError(e);
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Bad state: ', '');
    }

    _status = AuthStatus.unauthenticated;
    notifyListeners();
    return null;
  }

  Future<bool> completeGoogleSignUp({
    required String idToken,
    required Map<String, dynamic> profile,
  }) async {
    _status = AuthStatus.loading;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await ApiService.googleAuth({
        'id_token': idToken,
        ...profile,
      });
      final result = await _handleGoogleAuthResponse(response.data);
      if (result.requiresProfile) {
        _errorMessage = 'Please complete all required profile fields.';
        _status = AuthStatus.unauthenticated;
        notifyListeners();
        return false;
      }
      return true;
    } on DioException catch (e) {
      _errorMessage = _extractError(e);
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Bad state: ', '');
    }

    _status = AuthStatus.unauthenticated;
    notifyListeners();
    return false;
  }

  Future<GoogleAuthResult> _handleGoogleAuthResponse(
    dynamic responseData, {
    String? idToken,
  }) async {
    if (responseData is! Map) {
      throw const FormatException('Invalid Google sign-in response.');
    }
    if (responseData['requires_profile'] == true) {
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return GoogleAuthResult(
        requiresProfile: true,
        idToken: idToken,
        email: responseData['email']?.toString(),
        firstName: responseData['first_name']?.toString(),
        lastName: responseData['last_name']?.toString(),
      );
    }

    final token = responseData['token'];
    if (token is! String || token.isEmpty) {
      throw const FormatException(
          'Google sign-in response did not include a token.');
    }
    final role = responseData['role'];
    final userData = _userDataFromResponse(responseData);
    _user = AppUser.fromJson(userData);
    await StorageService.saveToken(token);
    if (role != null) await StorageService.saveRole(role.toString());
    _status = AuthStatus.authenticated;
    _errorMessage = null;
    notifyListeners();
    return const GoogleAuthResult();
  }

  Future<bool> register(Map<String, dynamic> data) async {
    _status = AuthStatus.loading;
    _errorMessage = null;
    notifyListeners();
    try {
      await ApiService.register(data);
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return true;
    } on DioException catch (e) {
      _errorMessage = _extractError(e);
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    try {
      await ApiService.logout();
    } catch (_) {}
    await StorageService.clearToken();
    _user = null;
    _status = AuthStatus.unauthenticated;
    _sessionExpired = false;
    notifyListeners();
  }

  Future<void> refreshUser() async {
    _errorMessage = null;
    try {
      final response = await ApiService.getUser();
      _user = AppUser.fromJson(_userDataFromResponse(response.data));
    } on DioException catch (e) {
      _errorMessage = e.response?.statusCode == 401
          ? 'Your session expired. Please sign in again.'
          : ApiService.errorMessage(e);
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
    }
    notifyListeners();
  }

  void applyProfileUpdate(dynamic responseData) {
    _user = AppUser.fromJson(_userDataFromResponse(responseData));
    _errorMessage = null;
    notifyListeners();
  }

  void _handleUnauthorized() {
    if (_status != AuthStatus.authenticated || _user == null) return;
    _user = null;
    _status = AuthStatus.unauthenticated;
    _sessionExpired = true;
    _errorMessage = 'Your session expired. Please sign in again.';
    notifyListeners();
  }

  @override
  void dispose() {
    if (ApiService.onUnauthorized == _unauthorizedHandler) {
      ApiService.onUnauthorized = null;
    }
    super.dispose();
  }

  Map<String, dynamic> _userDataFromResponse(dynamic responseData) {
    if (responseData is! Map) {
      throw const FormatException('Invalid user response.');
    }

    final user = responseData['user'];
    if (user is Map) {
      return Map<String, dynamic>.from(user);
    }

    final data = responseData['data'];
    if (data is Map) {
      final nestedUser = data['user'];
      if (nestedUser is Map) {
        return Map<String, dynamic>.from(nestedUser);
      }
      return Map<String, dynamic>.from(data);
    }

    return Map<String, dynamic>.from(responseData);
  }

  String _extractError(DioException e) {
    return ApiService.errorMessage(e);
  }
}
