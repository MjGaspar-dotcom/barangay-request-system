"""Dataset summaries and leave-last-out recommender evaluation."""

import csv
from pathlib import Path
from typing import Any

from .data_gen import generate_data
from .engine import Recommender


AGE_BUCKETS = ("under-18", "18-24", "25-34", "35-44", "45-59", "60+")


def load_data(
    data_dir: str | Path | None = None,
) -> tuple[list[dict[str, str]], list[dict[str, str]]]:
    """Read CSVs in O(R + Q) time and space (sequential parsing and list storage)."""
    directory = (
        Path(data_dir)
        if data_dir is not None
        else Path(__file__).resolve().parent.parent / "data"
    )
    residents_path = directory / "residents.csv"
    requests_path = directory / "requests.csv"
    if not residents_path.exists() or not requests_path.exists():
        generate_data(directory)
    with residents_path.open(newline="", encoding="utf-8") as resident_file:
        residents = list(csv.DictReader(resident_file))
    with requests_path.open(newline="", encoding="utf-8") as request_file:
        requests = list(csv.DictReader(request_file))
    return residents, requests


def requests_per_document(
    requests: list[dict[str, Any]],
) -> dict[str, int]:
    """Count documents in O(Q) time and O(D) space (hash-map frequency table)."""
    counts: dict[str, int] = {}
    for request in requests:
        document = str(request["document"])
        counts[document] = counts.get(document, 0) + 1
    return counts


def requests_per_month(
    requests: list[dict[str, Any]],
) -> dict[str, int]:
    """Count YYYY-MM requests in O(Q + M log M) time and O(M) space (frequency table).

    Q is request count and M is the number of unique months.
    """
    counts: dict[str, int] = {}
    for request in requests:
        month = str(request["requested_at"])[:7]
        counts[month] = counts.get(month, 0) + 1
    return dict(sorted(counts.items()))


def top_document_by_age_bucket(
    residents: list[dict[str, Any]],
    requests: list[dict[str, Any]],
) -> dict[str, str]:
    """Find each age group's most requested document in O(R + Q) time and O(R + D) space.

    DSA concepts: hash-map grouping and deterministic frequency ranking.
    """
    resident_by_id = {str(resident["resident_id"]): resident for resident in residents}
    counts: dict[str, dict[str, int]] = {}
    for request in requests:
        resident = resident_by_id.get(str(request["resident_id"]))
        if resident is None:
            continue
        bucket = _age_bucket(resident.get("age"))
        if bucket is None:
            continue
        document = str(request["document"])
        bucket_counts = counts.setdefault(bucket, {})
        bucket_counts[document] = bucket_counts.get(document, 0) + 1

    result: dict[str, str] = {}
    for bucket, document_counts in counts.items():
        result[bucket] = min(
            document_counts,
            key=lambda document: (-document_counts[document], document),
        )
    return result


def evaluate(
    k: int = 3,
    data_dir: str | Path | None = None,
) -> dict[str, dict[str, float]]:
    """Run per-resident leave-last-out in O(R * (Q log Q + N log k)) time and O(Q + N) space.

    DSA concepts: leave-one-out evaluation, top-K heaps, and reciprocal rank.
    Prints Hit@1, Hit@3, and MRR for the engine and popularity baseline.
    """
    if not isinstance(k, int) or isinstance(k, bool) or k < 1:
        raise ValueError("k must be a positive integer")
    residents, requests = load_data(data_dir)
    requests_by_resident: dict[str, list[dict[str, Any]]] = {}
    for request in requests:
        requests_by_resident.setdefault(str(request["resident_id"]), []).append(request)
    for resident_requests in requests_by_resident.values():
        resident_requests.sort(
            key=lambda request: (str(request["requested_at"]), str(request["request_id"]))
        )

    totals = {
        model: {"hit_at_1": 0.0, "hit_at_3": 0.0, "mrr": 0.0}
        for model in ("Engine", "Popularity")
    }
    evaluated = 0
    recommendation_count = max(k, 3)

    for resident in residents:
        resident_id = str(resident["resident_id"])
        resident_requests = requests_by_resident.get(resident_id, [])
        if not resident_requests:
            continue

        held_out = resident_requests[-1]
        target = str(held_out["document"])
        training_requests = [
            request
            for request in requests
            if str(request["request_id"]) != str(held_out["request_id"])
        ]
        engine = Recommender().fit(residents, training_requests)
        recommendations = engine.recommend(
            resident_id,
            k=recommendation_count,
            exclude_pending=True,
        )
        engine_documents = [
            result["document"] for result in recommendations
        ]
        pending_documents = {
            str(request["document"])
            for request in resident_requests[:-1]
            if str(request.get("status", "")).lower() == "pending"
        }
        popularity_scores = requests_per_document(training_requests)
        popularity_documents = [
            document
            for document in sorted(
                popularity_scores,
                key=lambda item: (-popularity_scores[item], item),
            )
            if document not in pending_documents
        ][:recommendation_count]

        for model_name, documents in (
            ("Engine", engine_documents),
            ("Popularity", popularity_documents),
        ):
            rank = documents.index(target) + 1 if target in documents else None
            if rank is not None:
                totals[model_name]["mrr"] += 1 / rank
                if rank == 1:
                    totals[model_name]["hit_at_1"] += 1
                if rank <= 3:
                    totals[model_name]["hit_at_3"] += 1
        evaluated += 1

    if evaluated:
        for metrics in totals.values():
            for metric in metrics:
                metrics[metric] /= evaluated

    print(f"{'Model':<14} {'Hit@1':>8} {'Hit@3':>8} {'MRR':>8}")
    print("-" * 42)
    for model_name, metrics in totals.items():
        print(
            f"{model_name:<14} {metrics['hit_at_1']:>8.3f} "
            f"{metrics['hit_at_3']:>8.3f} {metrics['mrr']:>8.3f}"
        )
    print(f"Evaluated residents: {evaluated}")
    return totals


def _age_bucket(age: Any) -> str | None:
    """Map an age to a bucket in O(1) time and space (categorical grouping)."""
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
