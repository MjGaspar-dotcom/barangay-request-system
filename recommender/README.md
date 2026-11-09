# For You document recommender

This Python 3.10+ package ranks the six configured barangay documents for a
resident and returns a score, match percentage, and plain-English reason.
It uses only the Python standard library. The included CSV data is synthetic
and generated with a fixed seed; it contains no real resident information.

Generate or refresh the dataset and run the recommender:

```powershell
python -m recommender.data_gen
python -m recommender.cli --resident R001 --k 3
python -m recommender.cli --evaluate
```

The public API is `Recommender.fit(residents, requests)` followed by
`Recommender.recommend(resident_id, k=3, exclude_pending=True)`. It accepts
lists of dictionaries (as returned by `csv.DictReader`) and returns
JSON-ready dictionaries. An unknown resident ID is treated as a cold start.

## DSA concepts used

| Concept | Implementation |
| --- | --- |
| Hash maps | `engine.py`, `Recommender.fit` stores residents, histories, request frequencies, and month frequencies in dictionaries. |
| Heap / priority queue | `data_structures.py`, `MinHeap` implements `push`, `pop`, `peek`, `size`, `sift_up`, and `sift_down` over an array. |
| Directed weighted graph | `data_structures.py`, `WeightedDigraph` accumulates directed request transitions; `engine.py`, `Recommender.fit` adds each consecutive document pair. |
| k-nearest neighbors | `engine.py`, `Recommender._similarity` compares five weighted profile attributes; `_cohort_document_scores` selects up to 15 neighbors with a bounded `MinHeap`. |
| Exponential recency decay | `engine.py`, `Recommender.fit` discounts personal history with a 90-day half-life: `0.5 ** (age_days / 90)`. |
| Top-K selection | `engine.py`, `Recommender.recommend` maintains a size-K `MinHeap`, then pops and reverses the results into descending rank order. |
| Cold-start fallback | `engine.py`, `Recommender.recommend` gives history and sequence zero weight when there is no resident request history, then renormalizes the remaining signal weights. |

## Complexity

Let Q be the number of requests, N the number of residents, D the six
documents in the catalog, and K the requested result count.

- `Recommender.fit`: O(Q log Q + N) time, due to sorting requests and building
  the dictionary indexes, transition graph, and frequency tables; O(Q + N)
  space.
- `Recommender.recommend`: O(N log 15 + Q_15 + Q_r + D log K) time, where
  Q_15 is the number of requests belonging to the selected cohort and Q_r is
  the resident's own request count; O(N + Q_15 + D + K) space.
- `MinHeap.push` and `MinHeap.pop`: O(log n) time; `peek` and `size`: O(1)
  time; the heap uses O(n) space.
- `WeightedDigraph.add_edge` and `neighbors`: O(1) average lookup/update time
  per edge; adjacency storage is O(V + E) for V vertices and E edges.

`match_percent` is a relative score on a 0–100 scale, not a calibrated
probability that a resident will request the document.

## Tests

The test module is `recommender/tests/test_engine.py`. It is pytest-compatible
and also uses Python's built-in `unittest` API. Run it with pytest when
available, or without installing dependencies:

```powershell
python -m pytest recommender/tests/test_engine.py
python -m unittest recommender.tests.test_engine
```
