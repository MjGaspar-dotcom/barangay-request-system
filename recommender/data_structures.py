"""Hand-built data structures used by the document recommender."""

from typing import Generic, TypeVar


T = TypeVar("T")


class MinHeap(Generic[T]):
    """Array-backed min-heap; push/pop are O(log n), peek/size are O(1), space O(n).

    DSA concept: binary heap / priority queue.
    """

    def __init__(self) -> None:
        """Create an empty heap in O(1) time and O(1) space (binary heap)."""
        self._items: list[T] = []

    def push(self, item: T) -> None:
        """Insert an item in O(log n) time and O(1) auxiliary space (priority queue)."""
        self._items.append(item)
        self.sift_up(len(self._items) - 1)

    def pop(self) -> T:
        """Remove the minimum in O(log n) time and O(1) auxiliary space (priority queue)."""
        if not self._items:
            raise IndexError("pop from empty MinHeap")

        minimum = self._items[0]
        last_item = self._items.pop()
        if self._items:
            self._items[0] = last_item
            self.sift_down(0)
        return minimum

    def peek(self) -> T:
        """Return the minimum in O(1) time and O(1) space (priority queue)."""
        if not self._items:
            raise IndexError("peek from empty MinHeap")
        return self._items[0]

    def size(self) -> int:
        """Return the item count in O(1) time and O(1) space (array-backed heap)."""
        return len(self._items)

    def sift_up(self, index: int) -> None:
        """Restore heap order upward in O(log n) time and O(1) space (binary heap)."""
        while index > 0:
            parent = (index - 1) // 2
            if self._items[parent] <= self._items[index]:
                break
            self._items[parent], self._items[index] = (
                self._items[index],
                self._items[parent],
            )
            index = parent

    def sift_down(self, index: int) -> None:
        """Restore heap order downward in O(log n) time and O(1) space (binary heap)."""
        item_count = len(self._items)
        while True:
            left = 2 * index + 1
            right = left + 1
            smallest = index

            if left < item_count and self._items[left] < self._items[smallest]:
                smallest = left
            if right < item_count and self._items[right] < self._items[smallest]:
                smallest = right
            if smallest == index:
                return

            self._items[index], self._items[smallest] = (
                self._items[smallest],
                self._items[index],
            )
            index = smallest


class WeightedDigraph:
    """Directed adjacency-list graph with accumulated edge counts.

    add_edge and neighbors are O(1) average time; space is O(V + E).
    DSA concept: weighted directed graph / hash-map adjacency list.
    """

    def __init__(self) -> None:
        """Create an empty graph in O(1) time and space (adjacency list)."""
        self._adjacency: dict[str, dict[str, float]] = {}

    def add_edge(self, source: str, target: str, weight: float = 1) -> None:
        """Add to an edge weight in O(1) average time and space (weighted digraph)."""
        if weight <= 0:
            raise ValueError("edge weight must be positive")
        targets = self._adjacency.setdefault(source, {})
        targets[target] = targets.get(target, 0) + weight
        self._adjacency.setdefault(target, {})

    def neighbors(self, node: str) -> dict[str, float]:
        """Copy outgoing edges in O(d) time and space, d = out-degree (adjacency list)."""
        return self._adjacency.get(node, {}).copy()
