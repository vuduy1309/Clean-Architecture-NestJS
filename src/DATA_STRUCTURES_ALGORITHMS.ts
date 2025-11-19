/**
 * CẤU TRÚC DỮ LIỆU & GIẢI THUẬT
 * 
 * Toàn bộ cấu trúc dữ liệu phổ biến + giải thuật + complexity analysis
 * Ví dụ code TypeScript
 */

// ============================================================================
// 1. ARRAY & LINKED LIST
// ============================================================================

/**
 * ARRAY (Mảng)
 * - Dữ liệu liên tiếp trong memory
 * - Index access O(1)
 * 
 * Complexity:
 * - Access: O(1)
 * - Search: O(n)
 * - Insert: O(n) (phải shift elements)
 * - Delete: O(n) (phải shift elements)
 * 
 * Ví dụ:
 * ```typescript
 * const arr = [1, 2, 3, 4, 5];
 * 
 * arr[0];           // O(1) - access
 * arr.push(6);      // O(1) amortized
 * arr.splice(2, 1); // O(n) - delete
 * ```
 */

/**
 * LINKED LIST (Danh sách liên kết)
 * - Nodes kết nối qua pointers
 * - Memory không liên tiếp
 * 
 * Complexity:
 * - Access: O(n) (phải traverse)
 * - Search: O(n)
 * - Insert: O(1) (nếu có node)
 * - Delete: O(1) (nếu có node)
 * 
 * Ví dụ:
 * ```typescript
 * class Node<T> {
 *   value: T;
 *   next: Node<T> | null;
 *   constructor(value: T) {
 *     this.value = value;
 *     this.next = null;
 *   }
 * }
 * 
 * class LinkedList<T> {
 *   head: Node<T> | null = null;
 * 
 *   insert(value: T) {
 *     const node = new Node(value);
 *     if (!this.head) {
 *       this.head = node;
 *     } else {
 *       let current = this.head;
 *       while (current.next) {
 *         current = current.next;
 *       }
 *       current.next = node;
 *     }
 *   }
 * 
 *   search(value: T): boolean {
 *     let current = this.head;
 *     while (current) {
 *       if (current.value === value) return true;
 *       current = current.next;
 *     }
 *     return false;
 *   }
 * }
 * ```
 * 
 * Khi dùng:
 * - Array: Cần access random, insert/delete ít
 * - LinkedList: Cần insert/delete nhiều
 */

// ============================================================================
// 2. STACK & QUEUE
// ============================================================================

/**
 * STACK (Ngăn xếp)
 * - LIFO: Last In First Out
 * - push() - thêm vào đỉnh
 * - pop() - lấy từ đỉnh
 * 
 * Complexity:
 * - Push: O(1)
 * - Pop: O(1)
 * - Peek: O(1)
 * 
 * Ví dụ:
 * ```typescript
 * class Stack<T> {
 *   private items: T[] = [];
 * 
 *   push(value: T): void {
 *     this.items.push(value);
 *   }
 * 
 *   pop(): T | undefined {
 *     return this.items.pop();
 *   }
 * 
 *   peek(): T | undefined {
 *     return this.items[this.items.length - 1];
 *   }
 * }
 * ```
 * 
 * Use cases:
 * - Browser back button
 * - Undo/Redo
 * - Function call stack
 * - Balanced parentheses check: ({[]})
 * - Reverse string
 */

/**
 * QUEUE (Hàng đợi)
 * - FIFO: First In First Out
 * - enqueue() - thêm vào cuối
 * - dequeue() - lấy từ đầu
 * 
 * Complexity:
 * - Enqueue: O(1)
 * - Dequeue: O(1)
 * 
 * Ví dụ:
 * ```typescript
 * class Queue<T> {
 *   private items: T[] = [];
 * 
 *   enqueue(value: T): void {
 *     this.items.push(value);
 *   }
 * 
 *   dequeue(): T | undefined {
 *     return this.items.shift();
 *   }
 * 
 *   peek(): T | undefined {
 *     return this.items[0];
 *   }
 * }
 * ```
 * 
 * Use cases:
 * - Job queue (printer, tasks)
 * - BFS (Breadth-First Search)
 * - Message queue (RabbitMQ, Kafka)
 * - Customer service queue
 */

// ============================================================================
// 3. HASH TABLE / MAP
// ============================================================================

/**
 * HASH TABLE (Bảng băm)
 * - Key-Value pairs
 * - Hash function: key → index
 * - O(1) lookup (average)
 * 
 * Complexity:
 * - Insert: O(1) average, O(n) worst
 * - Search: O(1) average, O(n) worst
 * - Delete: O(1) average, O(n) worst
 * 
 * Vấn đề: Hash collision
 * - 2 keys hash về cùng index
 * - Giải: Chaining (linked list) hoặc open addressing
 * 
 * Ví dụ:
 * ```typescript
 * // JavaScript Map
 * const map = new Map<string, number>();
 * 
 * map.set('john', 25);        // O(1)
 * map.get('john');            // O(1)
 * map.has('john');            // O(1)
 * map.delete('john');         // O(1)
 * 
 * // Object
 * const obj: Record<string, number> = {};
 * obj['john'] = 25;           // O(1)
 * ```
 * 
 * Use cases:
 * - Cache
 * - Counting frequencies
 * - Group by
 * - Finding duplicates
 * - Anagram check
 */

// ============================================================================
// 4. TREE
// ============================================================================

/**
 * BINARY SEARCH TREE (BST)
 * - Left < Parent < Right
 * - Tìm kiếm nhanh: O(log n)
 * 
 * Complexity:
 * - Search: O(log n) balanced, O(n) worst
 * - Insert: O(log n) balanced, O(n) worst
 * - Delete: O(log n) balanced, O(n) worst
 * 
 * Ví dụ:
 * ```typescript
 * class TreeNode {
 *   value: number;
 *   left: TreeNode | null = null;
 *   right: TreeNode | null = null;
 *   constructor(value: number) {
 *     this.value = value;
 *   }
 * }
 * 
 * class BST {
 *   root: TreeNode | null = null;
 * 
 *   insert(value: number): void {
 *     if (!this.root) {
 *       this.root = new TreeNode(value);
 *     } else {
 *       this._insertNode(this.root, value);
 *     }
 *   }
 * 
 *   private _insertNode(node: TreeNode, value: number): void {
 *     if (value < node.value) {
 *       if (node.left === null) {
 *         node.left = new TreeNode(value);
 *       } else {
 *         this._insertNode(node.left, value);
 *       }
 *     } else {
 *       if (node.right === null) {
 *         node.right = new TreeNode(value);
 *       } else {
 *         this._insertNode(node.right, value);
 *       }
 *     }
 *   }
 * 
 *   search(value: number): boolean {
 *     return this._searchNode(this.root, value);
 *   }
 * 
 *   private _searchNode(node: TreeNode | null, value: number): boolean {
 *     if (!node) return false;
 *     if (value === node.value) return true;
 *     if (value < node.value) {
 *       return this._searchNode(node.left, value);
 *     } else {
 *       return this._searchNode(node.right, value);
 *     }
 *   }
 * }
 * ```
 */

/**
 * BALANCED TREE (AVL, Red-Black)
 * - Tự động cân bằng khi insert/delete
 * - Đảm bảo O(log n) complexity
 * 
 * Ví dụ: Red-Black Tree
 * - Node có màu (red/black)
 * - Rotations để cân bằng
 * 
 * Use cases:
 * - TreeMap/TreeSet (Java)
 * - Database indexes
 */

/**
 * N-ARY TREE
 * - Node có nhiều children (không chỉ 2)
 * 
 * Ví dụ:
 * ```typescript
 * class NaryTreeNode<T> {
 *   value: T;
 *   children: NaryTreeNode<T>[] = [];
 *   constructor(value: T) {
 *     this.value = value;
 *   }
 * }
 * 
 * // Traversal (BFS)
 * function bfs<T>(root: NaryTreeNode<T>): T[] {
 *   const result: T[] = [];
 *   const queue: NaryTreeNode<T>[] = [root];
 * 
 *   while (queue.length > 0) {
 *     const node = queue.shift()!;
 *     result.push(node.value);
 *     queue.push(...node.children);
 *   }
 * 
 *   return result;
 * }
 * ```
 */

// ============================================================================
// 5. GRAPH
// ============================================================================

/**
 * GRAPH (Đồ thị)
 * - Vertices (nodes) + Edges (connections)
 * - Directed hoặc Undirected
 * - Weighted hoặc Unweighted
 * 
 * Representation:
 * 1. Adjacency List
 * 2. Adjacency Matrix
 * 3. Edge List
 * 
 * Ví dụ: Adjacency List
 * ```typescript
 * class Graph {
 *   private adjacencyList: Map<number, number[]> = new Map();
 * 
 *   addVertex(vertex: number): void {
 *     if (!this.adjacencyList.has(vertex)) {
 *       this.adjacencyList.set(vertex, []);
 *     }
 *   }
 * 
 *   addEdge(v1: number, v2: number): void {
 *     this.adjacencyList.get(v1)?.push(v2);
 *     this.adjacencyList.get(v2)?.push(v1); // Undirected
 *   }
 * }
 * ```
 * 
 * Traversal:
 * - BFS (Breadth-First Search): O(V + E)
 * - DFS (Depth-First Search): O(V + E)
 */

// ============================================================================
// 6. HEAP
// ============================================================================

/**
 * HEAP (Min-Heap, Max-Heap)
 * - Complete binary tree
 * - Min-Heap: Parent < Children
 * - Max-Heap: Parent > Children
 * 
 * Complexity:
 * - Insert: O(log n)
 * - Delete min/max: O(log n)
 * - Get min/max: O(1)
 * 
 * Ví dụ:
 * ```typescript
 * class MinHeap {
 *   private heap: number[] = [];
 * 
 *   insert(value: number): void {
 *     this.heap.push(value);
 *     this._bubbleUp(this.heap.length - 1);
 *   }
 * 
 *   extractMin(): number {
 *     const min = this.heap[0];
 *     this.heap[0] = this.heap.pop()!;
 *     this._bubbleDown(0);
 *     return min;
 *   }
 * 
 *   private _bubbleUp(index: number): void {
 *     while (index > 0) {
 *       const parentIndex = Math.floor((index - 1) / 2);
 *       if (this.heap[parentIndex] > this.heap[index]) {
 *         [this.heap[parentIndex], this.heap[index]] = 
 *         [this.heap[index], this.heap[parentIndex]];
 *         index = parentIndex;
 *       } else {
 *         break;
 *       }
 *     }
 *   }
 * }
 * ```
 * 
 * Use cases:
 * - Priority queue
 * - Dijkstra's algorithm
 * - Heap sort
 * - Finding k largest elements
 */

// ============================================================================
// 7. TRIE (Prefix Tree)
// ============================================================================

/**
 * TRIE (Tiền tố cây)
 * - Lưu trữ strings
 * - Share prefixes
 * 
 * Complexity:
 * - Insert: O(m) - m là độ dài string
 * - Search: O(m)
 * 
 * Ví dụ:
 * ```typescript
 * class TrieNode {
 *   children: Map<string, TrieNode> = new Map();
 *   isEndOfWord: boolean = false;
 * }
 * 
 * class Trie {
 *   root: TrieNode = new TrieNode();
 * 
 *   insert(word: string): void {
 *     let node = this.root;
 *     for (const char of word) {
 *       if (!node.children.has(char)) {
 *         node.children.set(char, new TrieNode());
 *       }
 *       node = node.children.get(char)!;
 *     }
 *     node.isEndOfWord = true;
 *   }
 * 
 *   search(word: string): boolean {
 *     let node = this.root;
 *     for (const char of word) {
 *       if (!node.children.has(char)) return false;
 *       node = node.children.get(char)!;
 *     }
 *     return node.isEndOfWord;
 *   }
 * }
 * ```
 * 
 * Use cases:
 * - Autocomplete
 * - Spell checker
 * - IP routing
 * - Dictionary
 */

// ============================================================================
// 8. SORTING ALGORITHMS
// ============================================================================

/**
 * BUBBLE SORT
 * - Đơn giản, không hiệu quả
 * - Complexity: O(n²)
 * 
 * ```typescript
 * function bubbleSort(arr: number[]): number[] {
 *   for (let i = 0; i < arr.length; i++) {
 *     for (let j = 0; j < arr.length - i - 1; j++) {
 *       if (arr[j] > arr[j + 1]) {
 *         [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
 *       }
 *     }
 *   }
 *   return arr;
 * }
 * ```
 */

/**
 * QUICK SORT
 * - Chia để trị (Divide and Conquer)
 * - Complexity: O(n log n) average, O(n²) worst
 * - In-place
 * 
 * ```typescript
 * function quickSort(arr: number[], low = 0, high = arr.length - 1): number[] {
 *   if (low < high) {
 *     const pi = partition(arr, low, high);
 *     quickSort(arr, low, pi - 1);
 *     quickSort(arr, pi + 1, high);
 *   }
 *   return arr;
 * }
 * 
 * function partition(arr: number[], low: number, high: number): number {
 *   const pivot = arr[high];
 *   let i = low - 1;
 * 
 *   for (let j = low; j < high; j++) {
 *     if (arr[j] < pivot) {
 *       i++;
 *       [arr[i], arr[j]] = [arr[j], arr[i]];
 *     }
 *   }
 *   [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
 *   return i + 1;
 * }
 * ```
 */

/**
 * MERGE SORT
 * - Chia để trị
 * - Complexity: O(n log n) always
 * - Stable
 * - Không in-place (cần O(n) extra space)
 * 
 * ```typescript
 * function mergeSort(arr: number[]): number[] {
 *   if (arr.length <= 1) return arr;
 * 
 *   const mid = Math.floor(arr.length / 2);
 *   const left = mergeSort(arr.slice(0, mid));
 *   const right = mergeSort(arr.slice(mid));
 * 
 *   return merge(left, right);
 * }
 * 
 * function merge(left: number[], right: number[]): number[] {
 *   const result: number[] = [];
 *   let i = 0, j = 0;
 * 
 *   while (i < left.length && j < right.length) {
 *     if (left[i] < right[j]) {
 *       result.push(left[i++]);
 *     } else {
 *       result.push(right[j++]);
 *     }
 *   }
 * 
 *   return [...result, ...left.slice(i), ...right.slice(j)];
 * }
 * ```
 */

/**
 * HEAP SORT
 * - Complexity: O(n log n)
 * - In-place
 * 
 * ```typescript
 * function heapSort(arr: number[]): number[] {
 *   // Build max heap
 *   for (let i = Math.floor(arr.length / 2) - 1; i >= 0; i--) {
 *     heapify(arr, arr.length, i);
 *   }
 * 
 *   // Extract elements
 *   for (let i = arr.length - 1; i > 0; i--) {
 *     [arr[0], arr[i]] = [arr[i], arr[0]];
 *     heapify(arr, i, 0);
 *   }
 * 
 *   return arr;
 * }
 * 
 * function heapify(arr: number[], n: number, i: number): void {
 *   let largest = i;
 *   const left = 2 * i + 1;
 *   const right = 2 * i + 2;
 * 
 *   if (left < n && arr[left] > arr[largest]) largest = left;
 *   if (right < n && arr[right] > arr[largest]) largest = right;
 * 
 *   if (largest !== i) {
 *     [arr[i], arr[largest]] = [arr[largest], arr[i]];
 *     heapify(arr, n, largest);
 *   }
 * }
 * ```
 */

/**
 * COMPLEXITY COMPARISON:
 * 
 * ┌──────────────┬──────────┬──────────┬──────────┬──────────┐
 * │ Algorithm    │ Best     │ Average  │ Worst    │ Space    │
 * ├──────────────┼──────────┼──────────┼──────────┼──────────┤
 * │ Bubble Sort  │ O(n)     │ O(n²)    │ O(n²)    │ O(1)     │
 * │ Quick Sort   │ O(n log) │ O(n log) │ O(n²)    │ O(log n) │
 * │ Merge Sort   │ O(n log) │ O(n log) │ O(n log) │ O(n)     │
 * │ Heap Sort    │ O(n log) │ O(n log) │ O(n log) │ O(1)     │
 * │ Insertion    │ O(n)     │ O(n²)    │ O(n²)    │ O(1)     │
 * └──────────────┴──────────┴──────────┴──────────┴──────────┘
 * 
 * Dùng Quick Sort hoặc Merge Sort trong thực tế
 */

// ============================================================================
// 9. SEARCHING ALGORITHMS
// ============================================================================

/**
 * LINEAR SEARCH
 * - Complexity: O(n)
 * 
 * ```typescript
 * function linearSearch(arr: number[], target: number): number {
 *   for (let i = 0; i < arr.length; i++) {
 *     if (arr[i] === target) return i;
 *   }
 *   return -1;
 * }
 * ```
 */

/**
 * BINARY SEARCH
 * - Cần sorted array
 * - Complexity: O(log n)
 * 
 * ```typescript
 * function binarySearch(arr: number[], target: number): number {
 *   let left = 0, right = arr.length - 1;
 * 
 *   while (left <= right) {
 *     const mid = Math.floor((left + right) / 2);
 *     if (arr[mid] === target) return mid;
 *     if (arr[mid] < target) {
 *       left = mid + 1;
 *     } else {
 *       right = mid - 1;
 *     }
 *   }
 * 
 *   return -1;
 * }
 * ```
 */

// ============================================================================
// 10. DYNAMIC PROGRAMMING
// ============================================================================

/**
 * FIBONACCI
 * - Recursive (bad): O(2^n)
 * - Memoization (good): O(n)
 * - Tabulation (good): O(n), O(1) space
 * 
 * ```typescript
 * // Memoization (top-down)
 * function fibonacci(n: number, memo: Map<number, number> = new Map()): number {
 *   if (n <= 1) return n;
 *   if (memo.has(n)) return memo.get(n)!;
 * 
 *   const result = fibonacci(n - 1, memo) + fibonacci(n - 2, memo);
 *   memo.set(n, result);
 *   return result;
 * }
 * 
 * // Tabulation (bottom-up)
 * function fibonacciTab(n: number): number {
 *   if (n <= 1) return n;
 *   const dp = [0, 1];
 *   for (let i = 2; i <= n; i++) {
 *     dp[i] = dp[i - 1] + dp[i - 2];
 *   }
 *   return dp[n];
 * }
 * ```
 */

/**
 * LONGEST COMMON SUBSEQUENCE (LCS)
 * - Complexity: O(m × n)
 * 
 * ```typescript
 * function lcs(text1: string, text2: string): number {
 *   const m = text1.length, n = text2.length;
 *   const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
 * 
 *   for (let i = 1; i <= m; i++) {
 *     for (let j = 1; j <= n; j++) {
 *       if (text1[i - 1] === text2[j - 1]) {
 *         dp[i][j] = dp[i - 1][j - 1] + 1;
 *       } else {
 *         dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
 *       }
 *     }
 *   }
 * 
 *   return dp[m][n];
 * }
 * ```
 */

/**
 * 0/1 KNAPSACK
 * - Complexity: O(n × w)
 * 
 * ```typescript
 * function knapsack(weights: number[], values: number[], w: number): number {
 *   const n = weights.length;
 *   const dp = Array(n + 1).fill(null).map(() => Array(w + 1).fill(0));
 * 
 *   for (let i = 1; i <= n; i++) {
 *     for (let j = 1; j <= w; j++) {
 *       if (weights[i - 1] <= j) {
 *         dp[i][j] = Math.max(
 *           values[i - 1] + dp[i - 1][j - weights[i - 1]],
 *           dp[i - 1][j]
 *         );
 *       } else {
 *         dp[i][j] = dp[i - 1][j];
 *       }
 *     }
 *   }
 * 
 *   return dp[n][w];
 * }
 * ```
 */

// ============================================================================
// 11. GREEDY ALGORITHMS
// ============================================================================

/**
 * ACTIVITY SELECTION
 * - Chọn max activities không overlap
 * - Complexity: O(n log n) - sorting
 * 
 * ```typescript
 * function activitySelection(
 *   start: number[],
 *   finish: number[]
 * ): number[] {
 *   const activities = start.map((s, i) => ({ s, f: finish[i], i }));
 *   activities.sort((a, b) => a.f - b.f);
 * 
 *   const selected = [activities[0].i];
 *   let lastFinish = activities[0].f;
 * 
 *   for (let i = 1; i < activities.length; i++) {
 *     if (activities[i].s >= lastFinish) {
 *       selected.push(activities[i].i);
 *       lastFinish = activities[i].f;
 *     }
 *   }
 * 
 *   return selected;
 * }
 * ```
 */

/**
 * COIN CHANGE (Greedy)
 * - Lấy coin lớn nhất trước
 * ⚠️ Không luôn optimal! (ví dụ: [1,3,4], target=6 → 3+3, không 4+1)
 * - Dùng DP để optimal
 */

// ============================================================================
// 12. GRAPH ALGORITHMS
// ============================================================================

/**
 * BFS (Breadth-First Search)
 * - Complexity: O(V + E)
 * 
 * ```typescript
 * function bfs(graph: Map<number, number[]>, start: number): number[] {
 *   const visited = new Set<number>();
 *   const queue: number[] = [start];
 *   const result: number[] = [];
 * 
 *   visited.add(start);
 * 
 *   while (queue.length > 0) {
 *     const node = queue.shift()!;
 *     result.push(node);
 * 
 *     for (const neighbor of graph.get(node) || []) {
 *       if (!visited.has(neighbor)) {
 *         visited.add(neighbor);
 *         queue.push(neighbor);
 *       }
 *     }
 *   }
 * 
 *   return result;
 * }
 * ```
 */

/**
 * DFS (Depth-First Search)
 * - Complexity: O(V + E)
 * 
 * ```typescript
 * function dfs(graph: Map<number, number[]>, node: number, visited: Set<number> = new Set()): number[] {
 *   const result: number[] = [];
 *   visited.add(node);
 *   result.push(node);
 * 
 *   for (const neighbor of graph.get(node) || []) {
 *     if (!visited.has(neighbor)) {
 *       result.push(...dfs(graph, neighbor, visited));
 *     }
 *   }
 * 
 *   return result;
 * }
 * ```
 */

/**
 * DIJKSTRA'S ALGORITHM
 * - Shortest path (weighted graph)
 * - Complexity: O((V + E) log V) with heap
 * 
 * ```typescript
 * function dijkstra(
 *   graph: Map<number, [number, number][]>,
 *   start: number,
 *   n: number
 * ): number[] {
 *   const dist = Array(n).fill(Infinity);
 *   dist[start] = 0;
 * 
 *   const heap = new MinHeap([[0, start]]);
 * 
 *   while (!heap.isEmpty()) {
 *     const [d, node] = heap.extractMin();
 *     if (d > dist[node]) continue;
 * 
 *     for (const [neighbor, weight] of graph.get(node) || []) {
 *       const newDist = dist[node] + weight;
 *       if (newDist < dist[neighbor]) {
 *         dist[neighbor] = newDist;
 *         heap.insert([newDist, neighbor]);
 *       }
 *     }
 *   }
 * 
 *   return dist;
 * }
 * ```
 */

// ============================================================================
// 13. COMPLEXITY ANALYSIS CHEAT SHEET
// ============================================================================

/**
 * BIG O NOTATION
 * 
 * O(1) - Constant: Direct array access arr[0]
 * O(log n) - Logarithmic: Binary search
 * O(n) - Linear: Linear search
 * O(n log n) - Linearithmic: Merge sort, Quick sort
 * O(n²) - Quadratic: Bubble sort, nested loop
 * O(n³) - Cubic: 3 nested loops
 * O(2^n) - Exponential: Recursive Fibonacci
 * O(n!) - Factorial: Generate all permutations
 * 
 * ┌──────────┬──────────┬──────────┬──────────┬──────────┐
 * │ n        │ O(n)     │ O(n log) │ O(n²)    │ O(2^n)   │
 * ├──────────┼──────────┼──────────┼──────────┼──────────┤
 * │ 10       │ 10       │ 30       │ 100      │ 1024     │
 * │ 100      │ 100      │ 660      │ 10,000   │ overflow │
 * │ 1000     │ 1000     │ 10,000   │ 1,000,000│ overflow │
 * │ 10,000   │ 10,000   │ 130,000  │ 100M     │ overflow │
 * └──────────┴──────────┴──────────┴──────────┴──────────┘
 */

// ============================================================================
// 14. COMMON INTERVIEW PROBLEMS
// ============================================================================

/**
 * TWO SUM
 * - Find 2 numbers that sum to target
 * - Optimal: Hash map, O(n)
 * 
 * ```typescript
 * function twoSum(nums: number[], target: number): [number, number] {
 *   const seen = new Map<number, number>();
 *   for (let i = 0; i < nums.length; i++) {
 *     const complement = target - nums[i];
 *     if (seen.has(complement)) {
 *       return [seen.get(complement)!, i];
 *     }
 *     seen.set(nums[i], i);
 *   }
 *   return [-1, -1];
 * }
 * ```
 */

/**
 * REVERSE STRING
 * - In-place, O(n/2) swaps
 * 
 * ```typescript
 * function reverseString(s: string[]): void {
 *   let left = 0, right = s.length - 1;
 *   while (left < right) {
 *     [s[left], s[right]] = [s[right], s[left]];
 *     left++;
 *     right--;
 *   }
 * }
 * ```
 */

/**
 * VALID PARENTHESES
 * - Check (){}[]
 * - Stack, O(n)
 * 
 * ```typescript
 * function isValid(s: string): boolean {
 *   const stack: string[] = [];
 *   const pairs: Record<string, string> = { ')': '(', '}': '{', ']': '[' };
 * 
 *   for (const char of s) {
 *     if (char in pairs) {
 *       if (stack.pop() !== pairs[char]) return false;
 *     } else {
 *       stack.push(char);
 *     }
 *   }
 * 
 *   return stack.length === 0;
 * }
 * ```
 */

/**
 * PALINDROME CHECK
 * - Check if string reads same forwards/backwards
 * - O(n/2)
 * 
 * ```typescript
 * function isPalindrome(s: string): boolean {
 *   let left = 0, right = s.length - 1;
 *   while (left < right) {
 *     if (s[left] !== s[right]) return false;
 *     left++;
 *     right--;
 *   }
 *   return true;
 * }
 * ```
 */

console.log('✓ Data Structures & Algorithms guide created');
