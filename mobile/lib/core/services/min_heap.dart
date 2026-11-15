class MinHeap<T> {
  final int Function(T, T) _compare;
  final List<T> _items = [];

  MinHeap(this._compare);

  // The heap size is the number of items stored in the backing array.
  int get size => _items.length;

  // Insert an item and restore the min-heap property by bubbling it upward.
  void insert(T item) {
    _items.add(item);
    _bubbleUp(_items.length - 1);
  }

  // Read the smallest item without changing the heap.
  T? peek() => _items.isEmpty ? null : _items.first;

  // Remove the smallest item and restore order by bubbling the replacement down.
  T? extractMin() {
    if (_items.isEmpty) return null;
    if (_items.length == 1) return _items.removeLast();

    final minimum = _items.first;
    _items[0] = _items.removeLast();
    _bubbleDown(0);
    return minimum;
  }

  // Move a newly inserted item toward the root while it is smaller than its parent.
  void _bubbleUp(int index) {
    var childIndex = index;
    while (childIndex > 0) {
      final parentIndex = (childIndex - 1) ~/ 2;
      if (_compare(_items[childIndex], _items[parentIndex]) >= 0) break;
      _swap(childIndex, parentIndex);
      childIndex = parentIndex;
    }
  }

  // Move the root replacement toward a smaller child until heap order is restored.
  void _bubbleDown(int index) {
    var parentIndex = index;
    while (true) {
      final leftChild = parentIndex * 2 + 1;
      final rightChild = leftChild + 1;
      var smallest = parentIndex;

      if (leftChild < _items.length &&
          _compare(_items[leftChild], _items[smallest]) < 0) {
        smallest = leftChild;
      }
      if (rightChild < _items.length &&
          _compare(_items[rightChild], _items[smallest]) < 0) {
        smallest = rightChild;
      }
      if (smallest == parentIndex) return;

      _swap(parentIndex, smallest);
      parentIndex = smallest;
    }
  }

  // Exchange two array entries without changing their values.
  void _swap(int first, int second) {
    final temporary = _items[first];
    _items[first] = _items[second];
    _items[second] = temporary;
  }
}
