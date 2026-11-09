"""Command-line entry point for recommendations and offline evaluation."""

import argparse

from .analytics import evaluate, load_data
from .engine import Recommender


def build_parser() -> argparse.ArgumentParser:
    """Build CLI options in O(1) time and space (argument parsing)."""
    parser = argparse.ArgumentParser(
        description="Rank barangay documents for a resident using synthetic data."
    )
    parser.add_argument("--resident", default="R001", help="resident ID (default: R001)")
    parser.add_argument("--k", type=int, default=3, help="number of recommendations")
    parser.add_argument(
        "--evaluate",
        action="store_true",
        help="print leave-last-out metrics against global popularity",
    )
    return parser


def main(argv: list[str] | None = None) -> None:
    """Run a recommendation in O(Q log Q + N log 15 + Q_15 + D log k) time.

    Evaluation costs O(R * (Q log Q + N log 15)) time; either path uses
    O(Q + N) space. DSA concepts: model indexing and heap-based top-K.
    """
    arguments = build_parser().parse_args(argv)
    if arguments.k < 1:
        raise SystemExit("--k must be a positive integer")
    if arguments.evaluate:
        evaluate(arguments.k)
        return

    residents, requests = load_data()
    recommender = Recommender().fit(residents, requests)
    recommendations = recommender.recommend(arguments.resident, arguments.k)
    print(f"For You - {arguments.resident}")
    print("-" * 72)
    if not recommendations:
        print("No recommendations available.")
        return
    for rank, recommendation in enumerate(recommendations, start=1):
        print(
            f"{rank}. {recommendation['document']} "
            f"({recommendation['match_percent']}% match)"
        )
        print(f"   {recommendation['reason']}")


if __name__ == "__main__":
    main()
