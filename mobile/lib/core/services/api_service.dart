import 'package:dio/dio.dart';

import 'storage_service.dart';

class ApiService {
  static const String _baseUrl = 'http://10.130.162.117:8000/api';
  // Use http://127.0.0.1:8000/api for iOS or real device pointing to local

  static Dio? _dio;

  static Dio get dio {
    _dio ??= _createDio();
    return _dio!;
  }

  static Dio _createDio() {
    final d = Dio(
      BaseOptions(
        baseUrl: _baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {
          'Accept': 'application/json',
        },
      ),
    );

    d.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await StorageService.getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) async {
          if (e.response?.statusCode == 401) {
            await StorageService.clearToken();
          }
          return handler.next(e);
        },
      ),
    );

    return d;
  }

  // --- Auth ---
  static Future<Response> login(String username, String password) {
    return dio.post('/login', data: {
      'username': username,
      'password': password,
    });
  }

  static Future<Response> register(Map<String, dynamic> data) {
    return dio.post('/register', data: data);
  }

  static Future<Response> logout() {
    return dio.post('/logout');
  }

  static Future<Response> getUser() async {
    final response = await dio.get('/user');

    print('USER STATUS: ${response.statusCode}');
    print('USER RESPONSE: ${response.data}');

    return response;
  }

  // --- Profile ---
  static Future<Response> updateProfile(FormData formData) {
    return dio.patch('/profile', data: formData);
  }

  // --- Document Types ---
  static Future<Response> getDocumentTypes() {
    return dio.get('/document-types');
  }

  // --- Barangay Requests (Registered) ---
  static Future<Response> getMyRequests() {
    return dio.get('/barangay-requests');
  }

  static Future<Response> createRequest(Map<String, dynamic> data) {
    return dio.post('/barangay-requests', data: data);
  }

  // --- Guest Requests ---
  static Future<Response> createGuestRequest(FormData formData) {
    return dio.post('/guest-requests', data: formData);
  }

  // --- Track ---
  static Future<Response> trackRequest(String trackingNumber) {
    return dio.get('/track/$trackingNumber');
  }

  // --- Notifications ---
  static Future<Response> getNotifications() {
    return dio.get('/notifications');
  }
}
