import 'dart:math' as math;

import '../models/recommendation.dart';
import '../models/request_model.dart';
import '../models/user_model.dart';
import 'min_heap.dart';

class RecommendationEngine {
  static const int _neighborCount = 3;

  List<DocumentType> orderForYouDocuments({
    required int? residentAge,
    required List<DocumentType> availableDocuments,
    required List<ResidentRequest> requestHistory,
    required List<DocumentType> profileRecommendations,
    int limit = 3,
  }) {
    if (limit <= 0) return const [];

    final eligibleByName = {
      for (final document in availableDocuments)
        if (document.isActive && document.isEligibleForAge(residentAge))
          document.name.trim().toLowerCase(): document,
    };
    ResidentRequest? latestRequest;
    for (final request in requestHistory) {
      if (latestRequest == null || request.date.isAfter(latestRequest.date)) {
        latestRequest = request;
      }
    }

    final latestRequestedDocument = latestRequest == null
        ? null
        : eligibleByName[latestRequest.documentType.trim().toLowerCase()];
    final orderedDocuments = <DocumentType>[];
    if (latestRequestedDocument != null) {
      orderedDocuments.add(latestRequestedDocument);
    }
    for (final recommendation in profileRecommendations) {
      if (orderedDocuments.every(
        (document) => document.id != recommendation.id,
      )) {
        orderedDocuments.add(recommendation);
      }
    }

    return orderedDocuments.take(limit).toList(growable: false);
  }

  List<Recommendation> recommend({
    required AppUser resident,
    required Iterable<AppUser> residents,
    required List<DocumentType> documentTypes,
    List<ResidentRequest>? requestHistory,
    DateTime? now,
    bool includeRequestHistory = true,
  }) {
    final availableDocuments = documentTypes
        .where((document) =>
            document.isActive && document.isEligibleForAge(resident.age))
        .toList(growable: false);
    if (availableDocuments.isEmpty) return const [];

    final documentNames =
        availableDocuments.map((document) => document.name).toList();
    final residentHistory = resident.pastRequests;
    final history = includeRequestHistory
        ? (residentHistory != null && residentHistory.isNotEmpty
            ? residentHistory
            : requestHistory ?? const <ResidentRequest>[])
        : const <ResidentRequest>[];
    if (_isColdStart(resident, history)) {
      return _defaultRecommendations(documentNames);
    }

    final currentTime = now ?? DateTime.now();
    final rules = _ruleScores(resident, documentNames);
    final ruleScores = _normalizeScores(rules.scores);
    final historyScores = _historyScores(history, currentTime, documentNames);
    final similarScores =
        _similarScores(resident, history, residents, documentNames);
    final ranked = <_ScoredRecommendation>[];

    for (var index = 0; index < documentNames.length; index++) {
      final document = documentNames[index];
      final ruleScore = ruleScores[document] ?? 0;
      final historyScore = historyScores[document] ?? 0;
      final similarScore = similarScores[document] ?? 0;
      final score = 0.4 * ruleScore + 0.35 * historyScore + 0.25 * similarScore;

      ranked.add(
        _ScoredRecommendation(
          index: index,
          recommendation: Recommendation(
            documentType: document,
            score: score,
            reason: _reasonFor(
              document,
              ruleScore: ruleScore,
              historyScore: historyScore,
              similarScore: similarScore,
              ruleReasons: rules.reasons,
            ),
          ),
        ),
      );
    }

    return _topThree(ranked);
  }

  _RuleScores _ruleScores(AppUser resident, List<String> documentNames) {
    final scores = <String, double>{for (final doc in documentNames) doc: 0};
    final reasons = <String, String>{};

    void addMatching(
      List<String> keywords,
      double weight,
      String reason, {
      bool excludeBusinessClearance = false,
    }) {
      for (final document in documentNames) {
        final normalized = document.toLowerCase();
        if (!keywords.any(normalized.contains) ||
            (excludeBusinessClearance &&
                normalized.contains('business clearance'))) {
          continue;
        }
        scores[document] = (scores[document] ?? 0) + weight;
        reasons.putIfAbsent(document, () => reason);
      }
    }

    final employment = resident.employmentStatus?.trim().toLowerCase();
    if (employment == 'employed' || employment == 'unemployed') {
      addMatching(
        ['barangay clearance'],
        0.8,
        'Based on your employment status',
        excludeBusinessClearance: true,
      );
    }
    if (employment == 'unemployed') {
      addMatching(
        ['indigency', 'low income', 'no income', 'unemployment'],
        1,
        'Based on your employment status',
      );
    }
    if (employment == 'student') {
      addMatching(
        ['good moral', 'school'],
        1,
        'Based on your student status',
      );
    }
    if (resident.hasBusiness == true) {
      addMatching(
        ['business clearance'],
        1,
        'Based on your business ownership',
      );
    }
    if ((resident.yearsOfResidency ?? 0) >= 1) {
      addMatching(
        ['residency'],
        0.8,
        'Based on your years of residency',
      );
    }
    if ((resident.age ?? 0) >= 18) {
      addMatching(['barangay id'], 0.5, 'Based on your age');
    }

    return _RuleScores(scores: scores, reasons: reasons);
  }

  Map<String, double> _normalizeScores(Map<String, double> scores) {
    final maximum = scores.values.fold<double>(
      0,
      (current, value) => math.max(current, value),
    );
    if (maximum == 0) {
      return {for (final document in scores.keys) document: 0};
    }
    return {
      for (final entry in scores.entries) entry.key: entry.value / maximum,
    };
  }

  Map<String, double> _historyScores(
    List<ResidentRequest> history,
    DateTime now,
    List<String> documentNames,
  ) {
    final weightedCounts = <String, double>{};
    final knownNames = {
      for (final document in documentNames) document.toLowerCase(): document,
    };
    for (final request in history) {
      final document = knownNames[request.documentType.trim().toLowerCase()];
      if (document == null) continue;
      final ageInDays = math.max(0, now.difference(request.date).inDays);
      final decay = math.exp(-ageInDays / 365);
      weightedCounts[document] = (weightedCounts[document] ?? 0) + decay;
    }
    return _normalizeScores(weightedCounts);
  }

  Map<String, double> _similarScores(
    AppUser resident,
    List<ResidentRequest> history,
    Iterable<AppUser> residents,
    List<String> documentNames,
  ) {
    final currentVector = _countVector(history, documentNames);
    if (currentVector.isEmpty) {
      return {for (final document in documentNames) document: 0};
    }

    final neighbors =
        _topNeighbors(resident, currentVector, residents, documentNames);
    final weightedCounts = <String, double>{};
    for (final neighbor in neighbors) {
      final neighborVector = _countVector(
        neighbor.resident.pastRequests ?? [],
        documentNames,
      );
      for (final entry in neighborVector.entries) {
        weightedCounts[entry.key] = (weightedCounts[entry.key] ?? 0) +
            neighbor.similarity * entry.value;
      }
    }
    return _normalizeScores(weightedCounts);
  }

  List<_Neighbor> _topNeighbors(
    AppUser resident,
    Map<String, double> currentVector,
    Iterable<AppUser> residents,
    List<String> documentNames,
  ) {
    final heap = MinHeap<_Neighbor>((first, second) {
      final similarityOrder = first.similarity.compareTo(second.similarity);
      return similarityOrder != 0
          ? similarityOrder
          : first.resident.id.compareTo(second.resident.id);
    });

    for (final candidate in residents) {
      if (candidate.id == resident.id) continue;
      final candidateVector =
          _countVector(candidate.pastRequests ?? [], documentNames);
      final similarity = _cosineSimilarity(currentVector, candidateVector);
      if (similarity <= 0) continue;

      final neighbor = _Neighbor(candidate, similarity);
      if (heap.size < _neighborCount) {
        heap.insert(neighbor);
      } else if (similarity > heap.peek()!.similarity) {
        heap.extractMin();
        heap.insert(neighbor);
      }
    }

    final neighbors = <_Neighbor>[];
    while (heap.size > 0) {
      neighbors.add(heap.extractMin()!);
    }
    return neighbors;
  }

  double _cosineSimilarity(
    Map<String, double> first,
    Map<String, double> second,
  ) {
    var dotProduct = 0.0;
    var firstMagnitudeSquared = 0.0;
    var secondMagnitudeSquared = 0.0;
    for (final value in first.values) {
      firstMagnitudeSquared += value * value;
    }
    for (final value in second.values) {
      secondMagnitudeSquared += value * value;
    }
    for (final entry in first.entries) {
      dotProduct += entry.value * (second[entry.key] ?? 0);
    }

    final denominator =
        math.sqrt(firstMagnitudeSquared) * math.sqrt(secondMagnitudeSquared);
    return denominator == 0 ? 0 : dotProduct / denominator;
  }

  Map<String, double> _countVector(
    List<ResidentRequest> history,
    List<String> documentNames,
  ) {
    final vector = <String, double>{};
    final knownNames = {
      for (final document in documentNames) document.toLowerCase(): document,
    };
    for (final request in history) {
      final document = knownNames[request.documentType.trim().toLowerCase()];
      if (document == null) continue;
      vector[document] = (vector[document] ?? 0) + 1;
    }
    return vector;
  }

  List<Recommendation> _topThree(List<_ScoredRecommendation> ranked) {
    final heap = MinHeap<_ScoredRecommendation>((first, second) {
      final scoreOrder =
          first.recommendation.score.compareTo(second.recommendation.score);
      return scoreOrder != 0 ? scoreOrder : second.index.compareTo(first.index);
    });

    for (final candidate in ranked) {
      if (heap.size < 3) {
        heap.insert(candidate);
      } else {
        final lowest = heap.peek()!;
        final comparison = candidate.recommendation.score
            .compareTo(lowest.recommendation.score);
        if (comparison > 0 ||
            (comparison == 0 && candidate.index < lowest.index)) {
          heap.extractMin();
          heap.insert(candidate);
        }
      }
    }

    final recommendations = <Recommendation>[];
    while (heap.size > 0) {
      recommendations.insert(0, heap.extractMin()!.recommendation);
    }
    return recommendations;
  }

  String _reasonFor(
    String document, {
    required double ruleScore,
    required double historyScore,
    required double similarScore,
    required Map<String, String> ruleReasons,
  }) {
    final ruleContribution = 0.4 * ruleScore;
    final historyContribution = 0.35 * historyScore;
    final similarContribution = 0.25 * similarScore;

    if (ruleContribution >= historyContribution &&
        ruleContribution >= similarContribution &&
        ruleScore > 0) {
      return ruleReasons[document] ?? 'Based on your profile';
    }
    if (historyContribution >= similarContribution && historyScore > 0) {
      return 'You requested this before';
    }
    if (similarScore > 0) return 'Residents like you requested this';
    return ruleReasons[document] ?? 'Based on your profile';
  }

  bool _isColdStart(AppUser resident, List<ResidentRequest> history) {
    return history.isEmpty &&
        resident.age == null &&
        (resident.civilStatus == null ||
            resident.civilStatus!.trim().isEmpty) &&
        (resident.employmentStatus == null ||
            resident.employmentStatus!.trim().isEmpty) &&
        resident.hasBusiness == null &&
        resident.yearsOfResidency == null;
  }

  List<Recommendation> _defaultRecommendations(List<String> documentNames) {
    return documentNames
        .take(3)
        .map(
          (document) => Recommendation(
            documentType: document,
            score: 0,
            reason: 'A helpful place to start',
          ),
        )
        .toList(growable: false);
  }
}

class _RuleScores {
  final Map<String, double> scores;
  final Map<String, String> reasons;

  const _RuleScores({required this.scores, required this.reasons});
}

class _Neighbor {
  final AppUser resident;
  final double similarity;

  const _Neighbor(this.resident, this.similarity);
}

class _ScoredRecommendation {
  final int index;
  final Recommendation recommendation;

  const _ScoredRecommendation({
    required this.index,
    required this.recommendation,
  });
}
