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
  BarangayRequest? _submittedRequest;
  String? _errorMessage;
  String? _successMessage;
  int _documentTypesRequestId = 0;
  CancelToken? _documentTypesCancelToken;

  RequestStatus get status => _status;
  List<BarangayRequest> get requests => _requests;
  List<DocumentType> get documentTypes => _documentTypes;
  DocumentTypesStatus get documentTypesStatus => _documentTypesStatus;
  String? get documentTypesError => _documentTypesError;
  TrackResult? get trackResult => _trackResult;
  BarangayRequest? get submittedRequest => _submittedRequest;
  String? get errorMessage => _errorMessage;
  String? get successMessage => _successMessage;

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

  Future<void> fetchMyRequests() async {
    if (_status == RequestStatus.loading) return;

    _status = RequestStatus.loading;
    notifyListeners();
    try {
      final response = await ApiService.getMyRequests();
      final List raw = response.data is List
          ? response.data
          : (response.data['data'] ?? response.data['requests'] ?? []);
      _requests = raw.map((e) => BarangayRequest.fromJson(e)).toList();
      _status = RequestStatus.loaded;
    } on DioException catch (e) {
      _errorMessage = _extractError(e);
      _status = RequestStatus.error;
    }
    notifyListeners();
  }

  Future<bool> createRegisteredRequest({
    required int documentTypeId,
    required String purpose,
  }) async {
    _status = RequestStatus.submitting;
    _errorMessage = null;
    _submittedRequest = null;
    notifyListeners();
    try {
      final response = await ApiService.createRequest({
        'document_type_id': documentTypeId,
        'purpose': purpose,
      });
      final payload = response.data;
      if (payload is! Map || payload['success'] != true) {
        throw const FormatException(
            'The request submission response was invalid.');
      }

      final data = payload['data'];
      if (data is! Map || data['request'] is! Map) {
        throw const FormatException('The submitted request was not returned.');
      }

      final qrCode = data['qr_code']?.toString();
      if (qrCode == null || !qrCode.trimLeft().startsWith('<svg')) {
        throw const FormatException(
            'The request tracking QR code was not returned.');
      }

      final requestData = Map<String, dynamic>.from(data['request'] as Map);
      requestData['qr_code'] = qrCode;
      requestData['document_type'] ??= {
        'id': documentTypeId,
        'name': _documentTypeName(documentTypeId),
      };
      _submittedRequest = BarangayRequest.fromJson(requestData);
      _requests = [
        _submittedRequest!,
        ..._requests.where((request) => request.id != _submittedRequest!.id),
      ];
      _status = RequestStatus.success;
      _successMessage = 'Request submitted successfully!';
      notifyListeners();
      return true;
    } on DioException catch (e) {
      _errorMessage = _extractError(e);
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

  String _documentTypeName(int id) {
    for (final documentType in _documentTypes) {
      if (documentType.id == id) return documentType.name;
    }
    return 'Document Request';
  }

  Future<bool> trackRequest(String trackingNumber) async {
    _status = RequestStatus.loading;
    _trackResult = null;
    _errorMessage = null;
    notifyListeners();
    try {
      final response = await ApiService.trackRequest(trackingNumber);
      final data = response.data;
      _trackResult = TrackResult.fromJson(data['data'] ?? data);
      _status = RequestStatus.loaded;
      notifyListeners();
      return true;
    } on DioException catch (e) {
      _errorMessage = _extractError(e);
      _status = RequestStatus.error;
      notifyListeners();
      return false;
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
}
