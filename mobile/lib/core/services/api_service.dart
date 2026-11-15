import 'package:dio/dio.dart';

import 'storage_service.dart';

class ApiService {
  static const String _baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://127.0.0.1:8000/api',
  );
  static String get baseUrl => _baseUrl;

  static String storageUrl(String path) {
    final trimmedPath = path.trim();
    final parsedPath = Uri.tryParse(trimmedPath);
    if (parsedPath != null && parsedPath.hasScheme) return trimmedPath;

    final relativePath = trimmedPath
        .replaceFirst(RegExp(r'^/?storage/'), '')
        .replaceFirst(RegExp(r'^/+'), '');
    final apiUri = Uri.parse(_baseUrl);
    return apiUri
        .replace(path: '/storage/$relativePath', query: null, fragment: null)
        .toString();
  }

  static Dio? _dio;
  static void Function()? onUnauthorized;

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
            if (!e.requestOptions.path.endsWith('/login')) {
              onUnauthorized?.call();
            }
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

  static Future<Response> googleAuth(Map<String, dynamic> data) {
    return dio.post('/auth/google', data: data);
  }

  static Future<Response> register(Map<String, dynamic> data) {
    return dio.post('/register', data: data);
  }

  static Future<Response> logout() {
    return dio.post('/logout');
  }

  static Future<Response> getUser() {
    return dio.get('/user');
  }

  // --- Profile ---
  static Future<Response> updateProfile(FormData formData) {
    formData.fields.add(const MapEntry('_method', 'PATCH'));
    return dio.post('/profile', data: formData);
  }

  // --- Document Types ---
  static Future<Response> getDocumentTypes({CancelToken? cancelToken}) {
    return dio.get('/document-types', cancelToken: cancelToken);
  }

  static Future<Response> getRecommendations({CancelToken? cancelToken}) {
    return dio.get('/recommendations', cancelToken: cancelToken);
  }

  // --- Barangay Requests (Registered) ---
  static Future<Response> getMyRequests() {
    return dio.get('/barangay-requests');
  }

  static Future<Response> createRequest(Map<String, dynamic> data) {
    return dio.post('/barangay-requests', data: data);
  }

  static Future<Response> getGeneratedDocument(int requestId) {
    return dio.get('/barangay-requests/$requestId/generated-document');
  }

  static Future<Response<List<int>>> getGeneratedDocumentFile(int requestId) {
    return dio.get<List<int>>(
      '/barangay-requests/$requestId/generated-document/file',
      options: Options(responseType: ResponseType.bytes),
    );
  }

  // --- Track ---
  static Future<Response> trackRequest(String trackingNumber) {
    return dio.get('/track/$trackingNumber');
  }

  // --- Notifications ---
  static Future<Response> getNotifications() {
    return dio.get('/notifications');
  }

  static Future<Response> markNotificationAsRead(int notificationId) {
    return dio.patch('/notifications/$notificationId/read');
  }

  static Future<Response> markAllNotificationsAsRead() {
    return dio.patch('/notifications/read-all');
  }

  static String errorMessage(DioException error) {
    final data = error.response?.data;
    if (data is Map) {
      if (data['errors'] is Map) {
        final errors = data['errors'] as Map;
        final messages = errors.values
            .expand((value) => value is List ? value : [value])
            .map((value) => value.toString())
            .where((message) => message.isNotEmpty)
            .toList();
        if (messages.isNotEmpty) return messages.join('\n');
      }
      if (data['message'] is String && (data['message'] as String).isNotEmpty) {
        return data['message'] as String;
      }
    }

    return switch (error.type) {
      DioExceptionType.connectionTimeout =>
        'The connection to the server timed out.',
      DioExceptionType.sendTimeout => 'The upload timed out. Please try again.',
      DioExceptionType.receiveTimeout => 'The server took too long to respond.',
      DioExceptionType.connectionError =>
        'Cannot reach the server. Check that the API is running.',
      DioExceptionType.badResponse =>
        'The server returned an unexpected response (${error.response?.statusCode ?? 'unknown'}).',
      _ => error.message ?? 'An unexpected network error occurred.',
    };
  }
}
