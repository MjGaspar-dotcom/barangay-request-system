import 'package:flutter/material.dart';
import 'package:dio/dio.dart';

import '../models/request_model.dart';
import '../services/api_service.dart';

enum RequestStatus { initial, loading, loaded, submitting, success, error }

class RequestProvider extends ChangeNotifier {
  RequestStatus _status = RequestStatus.initial;
  List<BarangayRequest> _requests = [];
  List<DocumentType> _documentTypes = [];
  TrackResult? _trackResult;
  String? _errorMessage;
  String? _successMessage;
  String? _lastTrackingNumber;
  String? _lastQrPayload;

  RequestStatus get status => _status;
  List<BarangayRequest> get requests => _requests;
  List<DocumentType> get documentTypes => _documentTypes;
  TrackResult? get trackResult => _trackResult;
  String? get errorMessage => _errorMessage;
  String? get successMessage => _successMessage;
  String? get lastTrackingNumber => _lastTrackingNumber;
  String? get lastQrPayload => _lastQrPayload;

  Future<void> fetchDocumentTypes() async {
    if (_documentTypes.isNotEmpty) return;

    _status = RequestStatus.loading;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await ApiService.getDocumentTypes();
      final responseData = response.data;

      if (responseData is! Map) {
        throw Exception('Invalid document types response.');
      }

      if (responseData['success'] != true) {
        throw Exception(
          responseData['message']?.toString() ??
              'Failed to load document types.',
        );
      }

      final data = responseData['data'];

      if (data is! List) {
        throw Exception('Invalid document types data.');
      }

      final documentTypesById = <int, DocumentType>{};
      for (final item in data) {
        if (item is! Map) {
          throw Exception('Invalid document type item.');
        }

        final documentType =
            DocumentType.fromJson(Map<String, dynamic>.from(item));
        if (documentType.id <= 0) {
          throw Exception('Document type is missing a valid ID.');
        }

        documentTypesById.putIfAbsent(documentType.id, () => documentType);
      }

      _documentTypes = documentTypesById.values.toList();
      _status = RequestStatus.loaded;
    } on DioException catch (e) {
      _errorMessage = _extractError(e);
      _status = RequestStatus.error;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      _status = RequestStatus.error;
    }

    notifyListeners();
  }

  Future<void> fetchMyRequests() async {
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
    _lastTrackingNumber = null;
    _lastQrPayload = null;
    notifyListeners();
    try {
      final response = await ApiService.createRequest({
        'document_type_id': documentTypeId,
        'purpose': purpose,
      });
      _storeRequestReceipt(response.data);
      _status = RequestStatus.success;
      _successMessage = 'Request submitted successfully!';
      notifyListeners();
      await fetchMyRequests();
      return true;
    } on DioException catch (e) {
      _errorMessage = _extractError(e);
      _status = RequestStatus.error;
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      _status = RequestStatus.error;
      notifyListeners();
      return false;
    }
  }

  Future<String?> createGuestRequest(FormData formData) async {
    _status = RequestStatus.submitting;
    _errorMessage = null;
    _lastTrackingNumber = null;
    _lastQrPayload = null;
    notifyListeners();
    try {
      final response = await ApiService.createGuestRequest(formData);
      final responseData = response.data;
      if (responseData is! Map) {
        throw Exception('Invalid guest request response.');
      }

      final receipt = RequestReceipt.fromResponse(
        Map<String, dynamic>.from(responseData),
      );
      _lastTrackingNumber = receipt.trackingNumber;
      _lastQrPayload =
          receipt.qrPayload ?? ApiService.trackingUrl(receipt.trackingNumber);
      _status = RequestStatus.success;
      notifyListeners();
      return _lastTrackingNumber;
    } on DioException catch (e) {
      _errorMessage = _extractError(e);
      _status = RequestStatus.error;
      notifyListeners();
      return null;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      _status = RequestStatus.error;
      notifyListeners();
      return null;
    }
  }

  void _storeRequestReceipt(dynamic responseData) {
    if (responseData is! Map) {
      throw Exception('Invalid request response.');
    }

    final receipt = RequestReceipt.fromResponse(
      Map<String, dynamic>.from(responseData),
    );
    _lastTrackingNumber = receipt.trackingNumber;
    _lastQrPayload =
        receipt.qrPayload ?? ApiService.trackingUrl(receipt.trackingNumber);
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
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
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
    final data = e.response?.data;
    if (data is Map) {
      if (data.containsKey('errors')) {
        final errors = data['errors'] as Map;
        return errors.values.expand((v) => v is List ? v : [v]).join('\n');
      }
      if (data.containsKey('message')) return data['message'].toString();
    }
    if (e.response?.statusCode == 404) return 'Tracking number not found.';
    return 'An error occurred. Please try again.';
  }
}
