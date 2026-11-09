"""Behavior tests for the hand-built DSA recommender."""

import random
import unittest

from ..analytics import evaluate
from ..data_structures import MinHeap, WeightedDigraph
from ..engine import Recommender


class DataStructureTests(unittest.TestCase):
    """Test structures in O(n log n) time and O(n) space (heap and graph ADTs)."""

    def test_min_heap_matches_sorted_random_values(self) -> None:
        """Check heap ordering in O(n log n) time and O(n) space (priority queue)."""
        rng = random.Random(42)
        values = [rng.randint(-1000, 1000) for _ in range(500)]
        heap: MinHeap[int] = MinHeap()
        for value in values:
            heap.push(value)
        actual = [heap.pop() for _ in range(heap.size())]
        self.assertEqual(actual, sorted(values))
        self.assertEqual(heap.size(), 0)

    def test_weighted_digraph_accumulates_edges(self) -> None:
        """Check edges in O(1) average time and O(E) space (weighted adjacency list)."""
        graph = WeightedDigraph()
        graph.add_edge("Clearance", "Barangay ID")
        graph.add_edge("Clearance", "Barangay ID")
        graph.add_edge("Clearance", "Indigency", 3)
        self.assertEqual(
            graph.neighbors("Clearance"),
            {"Barangay ID": 2, "Indigency": 3},
        )
        self.assertEqual(graph.neighbors("missing"), {})


class RecommenderTests(unittest.TestCase):
    """Test ranking in O(R * (Q log Q + N log k)) time and O(Q + N) space."""

    def setUp(self) -> None:
        """Create a compact fixture in O(1) time and space (test fixture)."""
        self.residents = [
            {
                "resident_id": "R001",
                "age": 20,
                "civil_status": "single",
                "employment_status": "student",
                "purok": "Purok 1",
                "years_of_residency": 5,
                "owns_business": False,
            },
            {
                "resident_id": "R002",
                "age": 21,
                "civil_status": "single",
                "employment_status": "student",
                "purok": "Purok 1",
                "years_of_residency": 3,
                "owns_business": False,
            },
            {
                "resident_id": "R003",
                "age": 67,
                "civil_status": "widowed",
                "employment_status": "retired",
                "purok": "Purok 2",
                "years_of_residency": 25,
                "owns_business": False,
            },
            {
                "resident_id": "R004",
                "age": 22,
                "civil_status": "single",
                "employment_status": "student",
                "purok": "Purok 1",
                "years_of_residency": 2,
                "owns_business": False,
            },
        ]
        self.requests = [
            {
                "request_id": "Q001",
                "resident_id": "R001",
                "document": "Barangay Clearance",
                "requested_at": "2025-03-01",
                "status": "released",
            },
            {
                "request_id": "Q002",
                "resident_id": "R001",
                "document": "Certificate of Good Moral Character",
                "requested_at": "2025-05-01",
                "status": "released",
            },
            {
                "request_id": "Q003",
                "resident_id": "R002",
                "document": "Barangay Clearance",
                "requested_at": "2025-02-01",
                "status": "released",
            },
            {
                "request_id": "Q004",
                "resident_id": "R002",
                "document": "Barangay ID",
                "requested_at": "2025-04-01",
                "status": "released",
            },
            {
                "request_id": "Q005",
                "resident_id": "R003",
                "document": "Certificate of Indigency",
                "requested_at": "2025-04-05",
                "status": "released",
            },
            {
                "request_id": "Q006",
                "resident_id": "R001",
                "document": "Business Clearance",
                "requested_at": "2025-06-01",
                "status": "pending",
            },
        ]
        self.engine = Recommender().fit(self.residents, self.requests)

    def test_top_k_is_in_descending_score_order(self) -> None:
        """Verify list size and order in O(k) time and space (top-K selection)."""
        recommendations = self.engine.recommend("R001", k=3)
        self.assertEqual(len(recommendations), 3)
        scores = [item["score"] for item in recommendations]
        self.assertEqual(scores, sorted(scores, reverse=True))

    def test_cold_start_resident_gets_recommendations(self) -> None:
        """Verify profile ranking in O(N log 15 + D log k) time and O(k) result space."""
        recommendations = self.engine.recommend("R004", k=3)
        self.assertEqual(len(recommendations), 3)
        self.assertTrue(all(0 <= item["score"] <= 1 for item in recommendations))

    def test_pending_documents_are_excluded(self) -> None:
        """Verify exclusion in O(Q_r + D) time and O(D) space (hash-set filtering)."""
        recommendations = self.engine.recommend("R001", k=6, exclude_pending=True)
        self.assertNotIn(
            "Business Clearance",
            [item["document"] for item in recommendations],
        )

    def test_identical_input_produces_identical_output(self) -> None:
        """Verify repeatability in O(k) extra time and space (deterministic ranking)."""
        first = Recommender().fit(self.residents, self.requests).recommend("R001", 3)
        second = Recommender().fit(self.residents, self.requests).recommend("R001", 3)
        self.assertEqual(first, second)

    def test_engine_hit_at_three_is_at_least_popularity_baseline(self) -> None:
        """Compare in O(R * (Q log Q + N log k)) time and O(Q + N) space (leave-last-out)."""
        metrics = evaluate(k=3)
        self.assertGreaterEqual(
            metrics["Engine"]["hit_at_3"],
            metrics["Popularity"]["hit_at_3"],
        )


if __name__ == "__main__":
    unittest.main()
