import 'package:flutter/material.dart';
import 'package:dio/dio.dart';

import '../models/user_model.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

enum AuthStatus { initial, loading, authenticated, unauthenticated, error }

class AuthProvider extends ChangeNotifier {
  AuthStatus _status = AuthStatus.initial;
  AppUser? _user;
  String? _errorMessage;

  AuthStatus get status => _status;
  AppUser? get user => _user;
  String? get errorMessage => _errorMessage;
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
    } catch (_) {
      await StorageService.clearToken();
      _status = AuthStatus.unauthenticated;
    }
    notifyListeners();
  }

  Future<bool> login(String username, String password) async {
    _status = AuthStatus.loading;
    _errorMessage = null;
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
    notifyListeners();
  }

  Future<void> refreshUser() async {
    _errorMessage = null;
    try {
      final response = await ApiService.getUser();
      _user = AppUser.fromJson(_userDataFromResponse(response.data));
    } on DioException catch (e) {
      _errorMessage = _extractError(e);
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
    }
    notifyListeners();
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
    final data = e.response?.data;
    if (data is Map) {
      if (data.containsKey('errors')) {
        final errors = data['errors'] as Map;
        return errors.values
            .expand((v) => v is List ? v : [v])
            .join('\n');
      }
      if (data.containsKey('message')) {
        return data['message'].toString();
      }
    }
    return 'An unexpected error occurred. Please try again.';
  }
}
