import 'dart:async';

import 'package:flutter/material.dart';
import 'package:dio/dio.dart';

import '../models/request_model.dart';
import '../services/api_service.dart';

enum RequestStatus { initial, loading, loaded, submitting, success, error }

enum DocumentTypesStatus { initial, loading, loaded, error }

class RequestProvider extends ChangeNotifier {
  RequestStatus _status = RequestStatus.initial;
  List<BarangayRequest> _requests = [];
  List<DocumentType> _documentTypes = [];
  DocumentTypesStatus _documentTypesStatus = DocumentTypesStatus.initial;
  String? _documentTypesError;
  TrackResult? _trackResult;
  String? _errorMessage;
  String? _successMessage;
  BarangayRequest? _lastCreatedRequest;
  int _documentTypesRequestId = 0;
  CancelToken? _documentTypesCancelToken;
  bool _isFetchingRequests = false;
  int _trackRequestId = 0;
  int? _activeTrackRequestId;

  RequestStatus get status => _status;
  List<BarangayRequest> get requests => _requests;
  List<DocumentType> get documentTypes => _documentTypes;
  DocumentTypesStatus get documentTypesStatus => _documentTypesStatus;
  String? get documentTypesError => _documentTypesError;
  TrackResult? get trackResult => _trackResult;
  String? get errorMessage => _errorMessage;
  String? get successMessage => _successMessage;
  BarangayRequest? get lastCreatedRequest => _lastCreatedRequest;

  Future<void> fetchDocumentTypes({bool force = false}) async {
    if (_documentTypesStatus == DocumentTypesStatus.loading) {
      if (!force) return;
      _documentTypesCancelToken
          ?.cancel('A newer refresh replaced this request.');
    } else if (!force && _documentTypesStatus == DocumentTypesStatus.loaded) {
      return;
    }

    final requestId = ++_documentTypesRequestId;
    final cancelToken = CancelToken();
    _documentTypesCancelToken = cancelToken;
    if (_documentTypes.isEmpty) {
      _documentTypesStatus = DocumentTypesStatus.loading;
    }
    _documentTypesError = null;
    notifyListeners();

    try {
      final response =
          await ApiService.getDocumentTypes(cancelToken: cancelToken);
      final responseData = response.data;

      if (responseData is! Map) {
        throw const FormatException('Invalid document types response.');
      }

      if (responseData['success'] != true) {
        throw FormatException(
          responseData['message']?.toString() ??
              'Failed to load document types.',
        );
      }

      final data = responseData['data'];

      if (data is! List) {
        throw const FormatException('Invalid document types data.');
      }

      final documentTypesById = <int, DocumentType>{};
      for (final item in data) {
        if (item is! Map) {
          throw const FormatException('Invalid document type item.');
        }

        final documentType =
            DocumentType.fromJson(Map<String, dynamic>.from(item));
        if (documentType.id <= 0) {
          throw const FormatException(
            'Document type is missing a valid ID.',
          );
        }

        documentTypesById.putIfAbsent(documentType.id, () => documentType);
      }

      if (requestId != _documentTypesRequestId) return;
      _documentTypes = documentTypesById.values
          .where((documentType) => documentType.isActive)
          .toList();
      _documentTypesStatus = DocumentTypesStatus.loaded;
    } on DioException catch (e) {
      if (requestId != _documentTypesRequestId) return;
      _documentTypesError = ApiService.errorMessage(e);
      _documentTypesStatus = _documentTypes.isEmpty
          ? DocumentTypesStatus.error
          : DocumentTypesStatus.loaded;
    } on FormatException catch (e) {
      if (requestId != _documentTypesRequestId) return;
      _documentTypesError = e.message;
      _documentTypesStatus = _documentTypes.isEmpty
          ? DocumentTypesStatus.error
          : DocumentTypesStatus.loaded;
    }

    if (requestId == _documentTypesRequestId) {
      _documentTypesCancelToken = null;
      notifyListeners();
    }
  }

  Future<void> fetchMyRequests({bool silent = false}) async {
    if (_isFetchingRequests ||
        (silent &&
            (_status == RequestStatus.loading ||
                _status == RequestStatus.submitting))) {
      return;
    }

    _isFetchingRequests = true;
    if (!silent) {
      _status = RequestStatus.loading;
      _errorMessage = null;
      notifyListeners();
    }
    try {
      final response = await ApiService.getMyRequests();
      final rawRequests = _requestListFromResponse(response.data);
      final requests = rawRequests.map((item) {
        if (item is! Map) {
          throw const FormatException('Invalid request item in response.');
        }
        return BarangayRequest.fromJson(
          Map<String, dynamic>.from(item),
        );
      }).toList();
      requests.sort(BarangayRequest.compareNewestFirst);
      _requests = requests;
      _errorMessage = null;
      if (!silent ||
          (_status != RequestStatus.loading &&
              _status != RequestStatus.submitting)) {
        _status = RequestStatus.loaded;
      }
    } on DioException catch (e) {
      _errorMessage = ApiService.errorMessage(e);
      if (!silent || _requests.isEmpty) {
        _status = RequestStatus.error;
      }
    } on FormatException catch (e) {
      _errorMessage = e.message;
      if (!silent || _requests.isEmpty) {
        _status = RequestStatus.error;
      }
    } finally {
      _isFetchingRequests = false;
      notifyListeners();
    }
  }

  Future<bool> createRegisteredRequest({
    required int documentTypeId,
    required String purpose,
    Map<String, dynamic>? requestDetails,
  }) async {
    if (_status == RequestStatus.submitting) return false;

    _status = RequestStatus.submitting;
    _errorMessage = null;
    _lastCreatedRequest = null;
    notifyListeners();
    try {
      final response = await ApiService.createRequest({
        'document_type_id': documentTypeId,
        'purpose': purpose,
        if (requestDetails != null) 'request_data': requestDetails,
      });
      final payload = response.data;
      if (payload is! Map || payload['success'] == false) {
        throw FormatException(
          payload is Map
              ? payload['message']?.toString() ??
                  'The server did not confirm the request.'
              : 'Invalid request submission response.',
        );
      }

      final data = payload['data'];
      final requestData = data is Map ? data['request'] : null;
      if (requestData is! Map) {
        throw const FormatException(
          'The server did not return the submitted request.',
        );
      }
      final request = BarangayRequest.fromJson(
        Map<String, dynamic>.from(requestData),
      );
      if (request.trackingNumber == null ||
          request.trackingNumber!.trim().isEmpty) {
        throw const FormatException(
          'The server did not return a tracking number.',
        );
      }

      _lastCreatedRequest = request.copyWithQrCode(
        data is Map ? data['qr_code']?.toString() : null,
      );
      _status = RequestStatus.success;
      _successMessage = 'Request submitted successfully!';
      notifyListeners();
      unawaited(fetchMyRequests(silent: true));
      return true;
    } on DioException catch (e) {
      _errorMessage = ApiService.errorMessage(e);
      _status = RequestStatus.error;
      notifyListeners();
      return false;
    } on FormatException catch (e) {
      _errorMessage = e.message;
      _status = RequestStatus.error;
      notifyListeners();
      return false;
    }
  }

  Future<bool> trackRequest(
    String trackingNumber, {
    bool silent = false,
  }) async {
    if (silent && _activeTrackRequestId != null) return false;

    final requestId = ++_trackRequestId;
    _activeTrackRequestId = requestId;
    if (!silent) {
      _status = RequestStatus.loading;
      _trackResult = null;
      _errorMessage = null;
      notifyListeners();
    }
    try {
      final response = await ApiService.trackRequest(trackingNumber);
      final data = response.data;
      if (data is! Map || data['success'] == false) {
        throw FormatException(
          data is Map
              ? data['message']?.toString() ?? 'Request tracking failed.'
              : 'Invalid request tracking response.',
        );
      }
      final result = data['data'] ?? data;
      if (result is! Map) {
        throw const FormatException('Invalid request tracking data.');
      }
      if (requestId != _trackRequestId) return false;
      _trackResult = TrackResult.fromJson(
        Map<String, dynamic>.from(result),
      );
      _errorMessage = null;
      if (!silent ||
          (_status != RequestStatus.loading &&
              _status != RequestStatus.submitting)) {
        _status = RequestStatus.loaded;
      }
      notifyListeners();
      return true;
    } on DioException catch (e) {
      if (requestId != _trackRequestId) return false;
      _errorMessage = _extractError(e);
      if (!silent) {
        _status = RequestStatus.error;
      }
      notifyListeners();
      return false;
    } on FormatException catch (e) {
      if (requestId != _trackRequestId) return false;
      _errorMessage = e.message;
      if (!silent) {
        _status = RequestStatus.error;
      }
      notifyListeners();
      return false;
    } finally {
      if (_activeTrackRequestId == requestId) {
        _activeTrackRequestId = null;
      }
    }
  }

  void reset() {
    _status = RequestStatus.initial;
    _errorMessage = null;
    _successMessage = null;
    notifyListeners();
  }

  String _extractError(DioException e) {
    if (e.response?.statusCode == 404) return 'Tracking number not found.';
    return ApiService.errorMessage(e);
  }

  List<dynamic> _requestListFromResponse(dynamic response) {
    if (response is List) return response;
    if (response is! Map) {
      throw const FormatException('Invalid requests response.');
    }
    if (response['success'] == false) {
      throw FormatException(
        response['message']?.toString() ?? 'Requests could not be loaded.',
      );
    }

    dynamic data = response['data'] ?? response['requests'];
    if (data is Map) {
      data = data['data'] ?? data['requests'];
    }
    if (data is! List) {
      throw const FormatException('Request list is missing from the response.');
    }
    return data;
  }
}
