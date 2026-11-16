import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:barangay_mobile/core/providers/auth_provider.dart';
import 'package:barangay_mobile/core/services/api_service.dart';

void main() {
  test(
    'rejects staff login before storing its token',
    () => _expectRejectedLogin({
      'token': 'staff-token',
      'role': 'admin',
      'user': {'id': 7, 'username': 'staff'},
    }),
  );
  test(
    'rejects login when the backend omits the role',
    () => _expectRejectedLogin({
      'token': 'missing-role-token',
      'user': {'id': 8, 'username': 'unknown'},
    }),
  );
  test(
    'prefers the nested user role when checking access',
    () => _expectRejectedLogin({
      'token': 'staff-token',
      'role': 'user',
      'user': {'id': 9, 'username': 'staff', 'role': 'staff'},
    }),
  );
}

Future<void> _expectRejectedLogin(Map<String, dynamic> responseData) async {
  final dio = ApiService.dio;
  final originalInterceptors = List<Interceptor>.of(dio.interceptors);
  final originalUnauthorized = ApiService.onUnauthorized;
  final provider = AuthProvider();

  dio.interceptors
    ..clear()
    ..add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          handler.resolve(
            Response(
              requestOptions: options,
              statusCode: 200,
              data: responseData,
            ),
          );
        },
      ),
    );

  addTearDown(() {
    dio.interceptors
      ..clear()
      ..addAll(originalInterceptors);
    provider.dispose();
    ApiService.onUnauthorized = originalUnauthorized;
  });

  final accepted = await provider.login('staff', 'password');

  expect(accepted, isFalse);
  expect(provider.status, AuthStatus.unauthenticated);
  expect(provider.user, isNull);
  expect(provider.errorMessage, contains('resident accounts'));
}
