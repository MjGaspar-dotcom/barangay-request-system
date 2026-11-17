import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:barangay_mobile/core/providers/request_provider.dart';
import 'package:barangay_mobile/core/services/api_service.dart';

void main() {
  test('request submission does not wait for the background list refresh',
      () async {
    final provider = RequestProvider();
    final dio = ApiService.dio;
    final originalInterceptors = List<Interceptor>.of(dio.interceptors);
    final listFetchStarted = Completer<void>();
    final releaseListFetch = Completer<Response<dynamic>>();
    RequestOptions? listFetchOptions;
    Map<String, dynamic>? createdPayload;

    dio.interceptors
      ..clear()
      ..add(
        InterceptorsWrapper(
          onRequest: (options, handler) {
            if (options.method == 'GET') {
              listFetchOptions = options;
              listFetchStarted.complete();
              releaseListFetch.future.then(handler.resolve);
              return;
            }

            createdPayload = Map<String, dynamic>.from(options.data as Map);
            handler.resolve(
              Response(
                requestOptions: options,
                statusCode: 201,
                data: {
                  'success': true,
                  'data': {
                    'request': {
                      'id': 42,
                      'status': 'pending',
                      'tracking_number': 'BRG-42',
                      'created_at': '2026-11-16T10:00:00Z',
                      'purpose': 'School enrollment',
                    },
                    'qr_code': '<svg></svg>',
                  },
                },
              ),
            );
          },
        ),
      );

    addTearDown(() {
      if (!releaseListFetch.isCompleted && listFetchOptions != null) {
        releaseListFetch.complete(
          Response(
            requestOptions: listFetchOptions!,
            statusCode: 200,
            data: {'success': true, 'data': <dynamic>[]},
          ),
        );
      }
      dio.interceptors
        ..clear()
        ..addAll(originalInterceptors);
      provider.dispose();
    });

    final success = await provider.createRegisteredRequest(
      documentTypeId: 1,
      purpose: 'School enrollment',
      requestDetails: const {
        'business_name': 'Sample Shop',
        'business_address': '10 Main Street',
        'business_activity': 'Retail',
      },
    ).timeout(const Duration(seconds: 3));
    await listFetchStarted.future.timeout(const Duration(seconds: 3));

    expect(success, isTrue);
    expect(provider.lastCreatedRequest?.trackingNumber, 'BRG-42');
    expect(provider.status, RequestStatus.success);
    expect(
      createdPayload,
      containsPair('request_data', {
        'business_name': 'Sample Shop',
        'business_address': '10 Main Street',
        'business_activity': 'Retail',
      }),
    );

    releaseListFetch.complete(
      Response(
        requestOptions: listFetchOptions!,
        statusCode: 200,
        data: {'success': true, 'data': <dynamic>[]},
      ),
    );
    await Future<void>.delayed(Duration.zero);
  });

  test('request submission rejects a duplicate while the first is pending',
      () async {
    final provider = RequestProvider();
    final dio = ApiService.dio;
    final originalInterceptors = List<Interceptor>.of(dio.interceptors);
    final requestStarted = Completer<void>();
    final releaseRequest = Completer<Response<dynamic>>();
    var postCount = 0;

    dio.interceptors
      ..clear()
      ..add(
        InterceptorsWrapper(
          onRequest: (options, handler) {
            if (options.method == 'GET') {
              handler.resolve(
                Response(
                  requestOptions: options,
                  statusCode: 200,
                  data: {'success': true, 'data': <dynamic>[]},
                ),
              );
              return;
            }

            postCount++;
            requestStarted.complete();
            releaseRequest.future.then(handler.resolve);
          },
        ),
      );

    addTearDown(() {
      if (!releaseRequest.isCompleted) {
        releaseRequest.completeError(
          StateError('Test ended before the request was released.'),
        );
      }
      dio.interceptors
        ..clear()
        ..addAll(originalInterceptors);
      provider.dispose();
    });

    final firstSubmission = provider.createRegisteredRequest(
      documentTypeId: 1,
      purpose: 'School enrollment',
    );
    await requestStarted.future.timeout(const Duration(seconds: 3));

    final duplicateAccepted = await provider.createRegisteredRequest(
      documentTypeId: 1,
      purpose: 'School enrollment',
    );
    expect(duplicateAccepted, isFalse);
    expect(postCount, 1);

    releaseRequest.complete(
      Response(
        requestOptions: RequestOptions(path: '/barangay-requests'),
        statusCode: 201,
        data: {
          'success': true,
          'data': {
            'request': {
              'id': 42,
              'status': 'request_submitted',
              'tracking_number': 'BR-20261116-42',
              'created_at': '2026-11-16T10:00:00Z',
              'purpose': 'School enrollment',
            },
          },
        },
      ),
    );

    expect(await firstSubmission, isTrue);
    expect(postCount, 1);
  });
}
