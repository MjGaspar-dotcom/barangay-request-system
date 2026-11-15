import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../models/community_recommendation.dart';
import '../services/api_service.dart';

enum RecommendationStatus { initial, loading, loaded, error }

class RecommendationProvider extends ChangeNotifier {
  List<CommunityRecommendation> _recommendations = const [];
  RecommendationStatus _status = RecommendationStatus.initial;
  String? _ageGroup;
  String? _errorMessage;
  int _requestId = 0;
  int _consecutiveFailures = 0;
  DateTime? _retryNotBefore;
  CancelToken? _activeRequest;

  List<CommunityRecommendation> get recommendations => _recommendations;
  RecommendationStatus get status => _status;
  String? get ageGroup => _ageGroup;
  String? get errorMessage => _errorMessage;

  Future<void> fetch({bool force = false}) async {
    if (_status == RecommendationStatus.loading) {
      if (!force) return;
      _activeRequest?.cancel('A newer refresh replaced this request.');
    }
    final retryNotBefore = _retryNotBefore;
    if (!force &&
        retryNotBefore != null &&
        DateTime.now().isBefore(retryNotBefore)) {
      return;
    }

    final requestId = ++_requestId;
    final cancelToken = CancelToken();
    _activeRequest = cancelToken;
    if (_recommendations.isEmpty) {
      _status = RecommendationStatus.loading;
    }
    _errorMessage = null;
    notifyListeners();

    try {
      final response =
          await ApiService.getRecommendations(cancelToken: cancelToken);
      final responseData = response.data;
      if (responseData is! Map || responseData['data'] is! Map) {
        throw const FormatException('Invalid recommendations response.');
      }

      final data = Map<String, dynamic>.from(responseData['data'] as Map);
      final items = data['recommendations'];
      if (items is! List) {
        throw const FormatException('Invalid recommendations list.');
      }

      final recommendations = items.map((item) {
        if (item is! Map) {
          throw const FormatException('Invalid recommendation record.');
        }
        return CommunityRecommendation.fromJson(
          Map<String, dynamic>.from(item),
        );
      }).toList(growable: false);

      if (requestId != _requestId) return;
      _recommendations = recommendations;
      _ageGroup =
          data['age_group'] is String ? data['age_group'] as String : null;
      _status = RecommendationStatus.loaded;
      _consecutiveFailures = 0;
      _retryNotBefore = null;
    } on DioException catch (error) {
      if (requestId != _requestId) return;
      _scheduleRetry();
      _status = _recommendations.isEmpty
          ? RecommendationStatus.error
          : RecommendationStatus.loaded;
      _errorMessage = ApiService.errorMessage(error);
    } on FormatException {
      if (requestId != _requestId) return;
      _scheduleRetry();
      _status = _recommendations.isEmpty
          ? RecommendationStatus.error
          : RecommendationStatus.loaded;
      _errorMessage = 'The recommendations response was invalid.';
    }

    if (requestId == _requestId) {
      _activeRequest = null;
      notifyListeners();
    }
  }

  void _scheduleRetry() {
    _consecutiveFailures++;
    final exponent = _consecutiveFailures > 5 ? 5 : _consecutiveFailures;
    final delaySeconds = exponent == 5 ? 30 : 1 << exponent;
    _retryNotBefore = DateTime.now().add(Duration(seconds: delaySeconds));
  }
}
