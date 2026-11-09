"""Deterministic, explainable document recommendations using hand-built DSA."""

from datetime import date
from typing import Any

from .data_gen import DOCUMENTS
from .data_structures import MinHeap, WeightedDigraph


WEIGHTS = {
    "personal_history": 0.30,
    "sequence": 0.25,
    "cohort": 0.25,
    "seasonality": 0.10,
    "global_popularity": 0.10,
}
COHORT_K = 15
COHORT_ATTRIBUTE_WEIGHTS = {
    "age_bucket": 0.25,
    "civil_status": 0.15,
    "employment_status": 0.20,
    "purok": 0.20,
    "owns_business": 0.20,
}


class Recommender:
    """Fit in O(Q log Q + N) time and O(Q + N) space.

    DSA concepts: hash maps, a weighted directed graph, k-NN, exponential
    decay, and bounded min-heaps. Q is request count; N is resident count.
    """

    def __init__(self) -> None:
        """Initialize empty model indexes in O(1) time and space (hash maps)."""
        self.residents: dict[str, dict[str, Any]] = {}
        self.requests_by_resident: dict[str, list[dict[str, Any]]] = {}
        self.history_scores: dict[str, dict[str, float]] = {}
        self.history_counts: dict[str, dict[str, int]] = {}
        self.transitions = WeightedDigraph()
        self.monthly_counts: dict[int, dict[str, int]] = {}
        self.global_counts: dict[str, int] = {document: 0 for document in DOCUMENTS}
        self._fitted = False

    def fit(
        self,
        residents: list[dict[str, Any]],
        requests: list[dict[str, Any]],
    ) -> "Recommender":
        """Build indexes in O(Q log Q + N) time and O(Q + N) space.

        DSA concepts: hash maps, sorting, frequency tables, and graph edges.
        Q is request count; N is resident count.
        """
        self.residents = {
            str(resident["resident_id"]): resident for resident in residents
        }
        self.requests_by_resident = {resident_id: [] for resident_id in self.residents}
        ordered_requests = sorted(
            requests,
            key=lambda request: (str(request["requested_at"]), str(request["request_id"])),
        )
        self.transitions = WeightedDigraph()
        self.history_scores = {}
        self.history_counts = {}
        self.monthly_counts = {month: {} for month in range(1, 13)}
        self.global_counts = {document: 0 for document in DOCUMENTS}
        today = date.today()

        for request in ordered_requests:
            resident_id = str(request["resident_id"])
            document = str(request["document"])
            requested_date = date.fromisoformat(str(request["requested_at"]))
            self.requests_by_resident.setdefault(resident_id, []).append(request)
            self.global_counts[document] = self.global_counts.get(document, 0) + 1
            month_counts = self.monthly_counts[requested_date.month]
            month_counts[document] = month_counts.get(document, 0) + 1

            resident_scores = self.history_scores.setdefault(resident_id, {})
            resident_scores[document] = resident_scores.get(document, 0.0) + (
                0.5 ** (max(0, (today - requested_date).days) / 90)
            )
            resident_counts = self.history_counts.setdefault(resident_id, {})
            resident_counts[document] = resident_counts.get(document, 0) + 1

        for resident_requests in self.requests_by_resident.values():
            for previous, following in zip(resident_requests, resident_requests[1:]):
                self.transitions.add_edge(
                    str(previous["document"]), str(following["document"])
                )

        self._fitted = True
        return self

    def recommend(
        self,
        resident_id: str,
        k: int = 3,
        exclude_pending: bool = True,
    ) -> list[dict[str, Any]]:
        """Rank up to k documents in O(N log k + Q_r + D log k) time and O(N + D + k) space.

        N is resident count, Q_r is this resident's request count, and D is
        catalog size. DSA concepts: k-NN, hash maps, and bounded min-heaps.
        """
        if not self._fitted:
            raise RuntimeError("fit must be called before recommend")
        if not isinstance(k, int) or isinstance(k, bool) or k < 1:
            raise ValueError("k must be a positive integer")

        resident_id = str(resident_id)
        resident = self.residents.get(resident_id, {})
        resident_requests = self.requests_by_resident.get(resident_id, [])
        history = self.history_scores.get(resident_id, {})
        has_history = bool(resident_requests)
        latest_document = (
            str(resident_requests[-1]["document"]) if has_history else None
        )
        excluded = {
            str(request["document"])
            for request in resident_requests
            if exclude_pending and str(request.get("status", "")).lower() == "pending"
        }

        signal_scores: dict[str, dict[str, float]] = {
            signal: {document: 0.0 for document in DOCUMENTS}
            for signal in WEIGHTS
        }
        signal_reasons: dict[str, dict[str, str]] = {
            signal: {} for signal in WEIGHTS
        }
        self._fill_normalized(
            signal_scores["personal_history"],
            history,
        )
        for document, count in self.history_counts.get(resident_id, {}).items():
            if count:
                signal_reasons["personal_history"][document] = (
                    f"Because you requested {document} before"
                )

        if latest_document is not None:
            sequence_counts = self.transitions.neighbors(latest_document)
            self._fill_normalized(signal_scores["sequence"], sequence_counts)
            for document in sequence_counts:
                signal_reasons["sequence"][document] = (
                    f"Often requested next after {latest_document}"
                )

        cohort_scores = self._cohort_document_scores(resident_id, resident)
        self._fill_normalized(signal_scores["cohort"], cohort_scores)
        cohort_reason = self._cohort_reason(resident)
        for document in cohort_scores:
            signal_reasons["cohort"][document] = cohort_reason

        current_month = date.today().month
        self._fill_normalized(
            signal_scores["seasonality"],
            self.monthly_counts.get(current_month, {}),
        )
        for document, score in signal_scores["seasonality"].items():
            if score:
                signal_reasons["seasonality"][document] = (
                    "Commonly requested this time of year"
                )

        self._fill_normalized(
            signal_scores["global_popularity"],
            self.global_counts,
        )
        for document, score in signal_scores["global_popularity"].items():
            if score:
                signal_reasons["global_popularity"][document] = (
                    "One of the most requested documents"
                )

        active_signals = (
            ("cohort", "seasonality", "global_popularity")
            if not has_history
            else tuple(WEIGHTS)
        )
        weight_total = sum(WEIGHTS[signal] for signal in active_signals)
        weights = {
            signal: WEIGHTS[signal] / weight_total for signal in active_signals
        }

        top_documents: MinHeap[tuple[float, int, str, str]] = MinHeap()
        for catalog_index, document in enumerate(DOCUMENTS):
            if document in excluded:
                continue
            contributions = {
                signal: weights[signal] * signal_scores[signal][document]
                for signal in active_signals
            }
            score = sum(contributions.values())
            best_signal = max(active_signals, key=lambda signal: contributions[signal])
            reason = signal_reasons[best_signal].get(
                document, "Recommended based on your profile"
            )
            item = (score, -catalog_index, document, reason)
            if top_documents.size() < k:
                top_documents.push(item)
            elif item[:2] > top_documents.peek()[:2]:
                top_documents.pop()
                top_documents.push(item)

        ranked: list[tuple[float, int, str, str]] = []
        while top_documents.size():
            ranked.append(top_documents.pop())
        ranked.reverse()
        return [
            {
                "document": document,
                "score": round(score, 6),
                "match_percent": max(0, min(100, int(round(score * 100)))),
                "reason": reason,
            }
            for score, _catalog_order, document, reason in ranked
        ]

    @staticmethod
    def _fill_normalized(
        target: dict[str, float],
        raw_scores: dict[str, float],
    ) -> None:
        """Scale a signal by its maximum in O(D) time and O(1) extra space (normalization)."""
        maximum = max(raw_scores.values(), default=0.0)
        if maximum <= 0:
            return
        for document in target:
            target[document] = raw_scores.get(document, 0.0) / maximum

    def _cohort_document_scores(
        self,
        resident_id: str,
        resident: dict[str, Any],
    ) -> dict[str, float]:
        """Aggregate the closest 15 profiles in O(N log 15 + Q_k) time and O(N + Q_k) space.

        N is resident count and Q_k is the requests belonging to selected
        neighbors. DSA concepts: k-NN and a bounded min-heap.
        """
        nearest: MinHeap[tuple[float, str]] = MinHeap()
        for candidate_id, candidate in self.residents.items():
            if candidate_id == resident_id:
                continue
            similarity = self._similarity(resident, candidate)
            if similarity <= 0:
                continue
            candidate_item = (similarity, candidate_id)
            if nearest.size() < COHORT_K:
                nearest.push(candidate_item)
            elif candidate_item > nearest.peek():
                nearest.pop()
                nearest.push(candidate_item)

        scores: dict[str, float] = {}
        while nearest.size():
            similarity, neighbor_id = nearest.pop()
            for request in self.requests_by_resident.get(neighbor_id, []):
                document = str(request["document"])
                scores[document] = scores.get(document, 0.0) + similarity
        return scores

    @staticmethod
    def _similarity(
        first: dict[str, Any],
        second: dict[str, Any],
    ) -> float:
        """Compare five attributes in O(1) time and space (weighted k-NN distance)."""
        if not first or not second:
            return 0.0
        first_attributes = {
            "age_bucket": _age_bucket(first.get("age")),
            "civil_status": first.get("civil_status"),
            "employment_status": first.get("employment_status"),
            "purok": first.get("purok"),
            "owns_business": _as_bool(first.get("owns_business")),
        }
        second_attributes = {
            "age_bucket": _age_bucket(second.get("age")),
            "civil_status": second.get("civil_status"),
            "employment_status": second.get("employment_status"),
            "purok": second.get("purok"),
            "owns_business": _as_bool(second.get("owns_business")),
        }
        matching_weight = sum(
            weight
            for attribute, weight in COHORT_ATTRIBUTE_WEIGHTS.items()
            if first_attributes[attribute] == second_attributes[attribute]
            and first_attributes[attribute] is not None
        )
        return matching_weight / sum(COHORT_ATTRIBUTE_WEIGHTS.values())

    @staticmethod
    def _cohort_reason(resident: dict[str, Any]) -> str:
        """Describe cohort evidence in O(1) time and space (interpretable k-NN)."""
        employment = resident.get("employment_status")
        if employment == "student":
            group = "students"
        elif employment == "self-employed":
            group = "self-employed residents"
        elif employment in ("employed", "unemployed", "retired"):
            group = f"{employment} residents"
        else:
            group = "residents with similar profiles"

        if resident.get("purok"):
            return f"Popular among {group} in your purok"
        return f"Popular among {group}"


def _age_bucket(age: Any) -> str | None:
    """Map an age to one of six ranges in O(1) time and space (categorical feature)."""
    try:
        age_value = int(age)
    except (TypeError, ValueError):
        return None
    if age_value < 18:
        return "under-18"
    if age_value < 25:
        return "18-24"
    if age_value < 35:
        return "25-34"
    if age_value < 45:
        return "35-44"
    if age_value < 60:
        return "45-59"
    return "60+"


def _as_bool(value: Any) -> bool | None:
    """Normalize CSV booleans in O(1) time and space (feature encoding)."""
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        lowered = value.strip().lower()
        if lowered in ("true", "1", "yes"):
            return True
        if lowered in ("false", "0", "no"):
            return False
    return None
