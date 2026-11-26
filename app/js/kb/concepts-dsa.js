/* CodeMentor KB — data structures & algorithms */
(function () {
  'use strict';
  window.CM.kb.add('concepts', [
    {
      id: 'big-o', title: 'Time & Space Complexity (Big-O)', cat: 'Algorithms', level: 'Intermediate',
      aliases: ['big o', 'big-o', 'bigo', 'time complexity', 'space complexity', 'complexity', 'asymptotic', 'asymptotic notation', 'o(n)', 'o(1)', 'o(log n)', 'o(n^2)', 'o(n log n)', 'efficiency', 'algorithm analysis', 'big o notation', 'runtime complexity'],
      summary: 'Big-O describes how an algorithm\'s running time or memory grows as the input size grows, ignoring constant factors.',
      analogy: 'Finding a name in a phone book: reading every page is O(n). Opening the middle and halving each time is O(log n). A million pages needs only about 20 halvings.',
      explain: `| Big-O | Name | Example | ~ops for n = 1,000,000 |
|---|---|---|---|
| **O(1)** | constant | array index, hash lookup | 1 |
| **O(log n)** | logarithmic | binary search | 20 |
| **O(n)** | linear | one loop over the data | 1,000,000 |
| **O(n log n)** | linearithmic | merge sort, built-in sort | 20,000,000 |
| **O(n²)** | quadratic | two nested loops | 10¹² ❌ too slow |
| **O(2ⁿ)** | exponential | naive Fibonacci, all subsets | ☠️ |

### How to work it out
1. **Sequential** steps **add**: O(n) + O(n) = O(2n) → **O(n)**.
2. **Nested** loops **multiply**: a loop inside a loop gives **O(n²)**.
3. **Drop constants and smaller terms**: O(3n² + 5n + 7) → **O(n²)**.
4. **Halving** the problem each step gives **O(log n)**.
5. **Recursion**: (number of calls) × (work per call).

> [!TIP] Rule of thumb for coding problems
> About 10⁸ simple operations take roughly 1 second. With n = 10⁵, O(n²) = 10¹⁰ is too slow, so you need O(n log n) or better.`,
      deep: `### Best, average and worst case
Quick sort averages O(n log n), but its worst case is O(n²) on already-sorted input with a bad pivot. Big-O usually quotes the **worst case** unless stated otherwise.

### Amortized analysis
Appending to a dynamic array is usually O(1). Occasionally it copies everything (O(n)), but averaged over many appends it is still **O(1) amortized**.

### Space complexity
Count the *extra* memory: new arrays, hash maps and the **recursion stack**. Recursive DFS on a path of depth n uses O(n) stack space.

### Common data-structure costs
| Structure | Access | Search | Insert | Delete |
|---|---|---|---|---|
| Array | O(1) | O(n) | O(n) | O(n) |
| Linked list | O(n) | O(n) | O(1)* | O(1)* |
| Hash map | n/a | O(1) avg | O(1) avg | O(1) avg |
| Balanced BST | O(log n) | O(log n) | O(log n) | O(log n) |
| Heap | O(1) min/max | O(n) | O(log n) | O(log n) |
*when you already have the node`,
      code: {
        python: `def get_first(arr):          # O(1)
    return arr[0]

def total(arr):              # O(n)
    s = 0
    for x in arr:
        s += x
    return s

def has_duplicate(arr):      # O(n^2)
    for i in range(len(arr)):
        for j in range(i + 1, len(arr)):
            if arr[i] == arr[j]:
                return True
    return False

def has_duplicate_fast(arr): # O(n) time, O(n) extra space
    return len(set(arr)) != len(arr)`
      },
      mistakes: ['Thinking O(2n) is different from O(n). Constants are dropped.', 'Forgetting hidden loops: «x in list», «list.index», «str +=» and «.remove» are all O(n).', 'Ignoring recursion stack space.', 'Assuming the "fast" language makes O(n²) acceptable for n = 10⁵.'],
      quiz: [
        { q: 'Two nested loops, each running n times, are…', o: ['O(n)', 'O(2n)', 'O(n²)', 'O(log n)'], a: 2, why: 'Nested loops multiply: n × n.' },
        { q: 'Binary search on a sorted array of n elements is…', o: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], a: 1, why: 'It halves the search space each step.' }
      ],
      related: ['sorting', 'binary-search', 'hash-map', 'recursion']
    },
    {
      id: 'linked-list', title: 'Linked Lists', cat: 'Data Structures', level: 'Intermediate',
      aliases: ['linked list', 'linkedlist', 'singly linked list', 'doubly linked list', 'circular linked list', 'node', 'nodes', 'head node', 'next pointer', 'reverse linked list'],
      summary: 'A linked list is a chain of nodes where each node holds a value and a pointer to the next node.',
      analogy: 'A treasure hunt: each clue tells you where the next clue is. To reach clue 5 you must follow 1 → 2 → 3 → 4. You cannot jump straight there like you can with numbered lockers.',
      explain: `~~~text
head
 │
 ▼
[ 3 | •]──►[ 7 | •]──►[ 9 | null]
~~~
- Each **node** = data + reference to the next node.
- The list is reached through its **head**. If you lose the head, you lose the list.
- The last node points to «null» / «None».

| Operation | Array | Linked list |
|---|---|---|
| Access i-th element | O(1) | O(n) |
| Insert at front | O(n) | **O(1)** |
| Insert after a known node | O(n) | **O(1)** |
| Memory | compact | extra pointer per node |

**Types:** singly (next only), doubly (next and prev), circular (the last node points back to the head).`,
      deep: `### Classic interview patterns
- **Reverse a list**: three pointers (prev, curr, next).
- **Find the middle**: slow pointer moves 1 step, fast moves 2. When fast hits the end, slow is in the middle.
- **Detect a cycle**: Floyd's tortoise and hare. If slow == fast at some point, there is a cycle.
- **Merge two sorted lists**: use a dummy head node to simplify edge cases.

### Dummy (sentinel) nodes
Starting with «dummy = Node(0)» and «dummy.next = head» removes special cases for inserting or deleting at the head.`,
      code: {
        python: `class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

def reverse(head):
    prev, curr = None, head
    while curr:
        nxt = curr.next      # remember the rest
        curr.next = prev     # flip the pointer
        prev, curr = curr, nxt
    return prev              # new head

# build 1 -> 2 -> 3
head = Node(1); head.next = Node(2); head.next.next = Node(3)
head = reverse(head)
node = head
while node:
    print(node.data, end=" ")   # 3 2 1
    node = node.next`,
        java: `class Node {
    int data; Node next;
    Node(int d) { data = d; }
}
public class Main {
    static Node reverse(Node head) {
        Node prev = null, curr = head;
        while (curr != null) {
            Node next = curr.next;
            curr.next = prev;
            prev = curr;
            curr = next;
        }
        return prev;
    }
    public static void main(String[] args) {
        Node head = new Node(1); head.next = new Node(2); head.next.next = new Node(3);
        for (Node n = reverse(head); n != null; n = n.next) System.out.print(n.data + " ");
    }
}`,
        cpp: `#include <iostream>
struct Node { int data; Node* next; Node(int d) : data(d), next(nullptr) {} };

Node* pushFront(Node* head, int val) {     // O(1) insert at front
    Node* n = new Node(val);
    n->next = head;
    return n;
}
int main() {
    Node* head = nullptr;
    for (int v : {3, 2, 1}) head = pushFront(head, v);
    for (Node* p = head; p; p = p->next) std::cout << p->data << " ";  // 1 2 3
}`,
        c: `#include <stdio.h>
#include <stdlib.h>
struct Node { int data; struct Node* next; };

struct Node* push(struct Node* head, int val) {
    struct Node* n = malloc(sizeof(struct Node));
    n->data = val; n->next = head;
    return n;
}
int main() {
    struct Node* head = NULL;
    head = push(head, 3); head = push(head, 2); head = push(head, 1);
    for (struct Node* p = head; p != NULL; p = p->next) printf("%d ", p->data);
    while (head) { struct Node* t = head; head = head->next; free(t); }  // free memory
    return 0;
}`
      },
      mistakes: ['Losing the head reference while traversing. Use a separate pointer.', 'Dereferencing «null» when the list is empty or at the end.', 'Forgetting to update the «next» pointers when deleting a node.', 'C/C++: not freeing nodes, which leaks memory.'],
      practice: ['Reverse a linked list.', 'Find the middle node.', 'Detect a cycle.', 'Merge two sorted linked lists.', 'Remove the n-th node from the end.'],
      quiz: [
        { q: 'Accessing the 1000th element of a singly linked list takes…', o: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], a: 2, why: 'You must walk node by node from the head.' }
      ],
      related: ['arrays-lists', 'pointers', 'stack', 'queue']
    },
    {
      id: 'stack', title: 'Stacks (LIFO)', cat: 'Data Structures', level: 'Beginner',
      aliases: ['stack', 'stacks', 'lifo', 'last in first out', 'push pop', 'push', 'pop', 'peek', 'top of stack', 'stack data structure', 'balanced parentheses', 'valid parentheses', 'bracket matching'],
      summary: 'A stack is a Last-In-First-Out (LIFO) collection: you add (push) and remove (pop) items only from the top.',
      analogy: 'A stack of plates: you put plates on top and take from the top. The last plate added is the first one used.',
      explain: `| Operation | Meaning | Time |
|---|---|---|
| «push(x)» | add on top | O(1) |
| «pop()» | remove and return the top | O(1) |
| «peek()» / «top()» | look at the top without removing | O(1) |
| «isEmpty()» | check if empty | O(1) |

**Where stacks appear:** undo/redo, the browser back button, **function calls** (the call stack), checking balanced brackets, evaluating expressions, DFS, and backtracking.

| Language | Stack type |
|---|---|
| Python | «list» with «append» / «pop» |
| JavaScript | «Array» with «push» / «pop» |
| Java | «ArrayDeque<Integer>» (preferred over «Stack») |
| C++ | «std::stack<int>» |`,
      code: {
        python: `def is_balanced(s):
    pairs = {')': '(', ']': '[', '}': '{'}
    stack = []
    for ch in s:
        if ch in '([{':
            stack.append(ch)                  # push
        elif ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
    return not stack                          # everything matched?

print(is_balanced("{[()]}"), is_balanced("(]"))   # True False`,
        javascript: `function isBalanced(s) {
  const pairs = { ")": "(", "]": "[", "}": "{" };
  const stack = [];
  for (const ch of s) {
    if ("([{".includes(ch)) stack.push(ch);
    else if (ch in pairs && stack.pop() !== pairs[ch]) return false;
  }
  return stack.length === 0;
}
console.log(isBalanced("{[()]}"), isBalanced("(]"));`,
        java: `import java.util.ArrayDeque;
import java.util.Deque;

public class Main {
    static boolean isBalanced(String s) {
        Deque<Character> st = new ArrayDeque<>();
        for (char c : s.toCharArray()) {
            if (c == '(' || c == '[' || c == '{') st.push(c);
            else if (c == ')' || c == ']' || c == '}') {
                if (st.isEmpty()) return false;
                char open = st.pop();
                if ((c == ')' && open != '(') || (c == ']' && open != '[') || (c == '}' && open != '{')) return false;
            }
        }
        return st.isEmpty();
    }
    public static void main(String[] args) { System.out.println(isBalanced("{[()]}")); }
}`,
        cpp: `#include <iostream>
#include <stack>
using namespace std;
int main() {
    stack<int> st;
    st.push(1); st.push(2); st.push(3);
    while (!st.empty()) { cout << st.top() << " "; st.pop(); }  // 3 2 1
}`
      },
      mistakes: ['Popping from an empty stack (IndexError / EmptyStackException). Check first.', 'Using «list.pop(0)» in Python: that removes from the front (queue behaviour) and is O(n).', 'C++: «st.pop()» returns nothing. Read «st.top()» first.'],
      quiz: [
        { q: 'Push 1, 2, 3 then pop once. What is on top?', o: ['1', '2', '3', 'Empty'], a: 1, why: '3 was popped (last in, first out), leaving 2 on top.' }
      ],
      related: ['queue', 'recursion', 'graphs', 'linked-list']
    },
    {
      id: 'queue', title: 'Queues (FIFO)', cat: 'Data Structures', level: 'Beginner',
      aliases: ['queue', 'queues', 'fifo', 'first in first out', 'enqueue', 'dequeue', 'deque', 'double ended queue', 'circular queue', 'collections deque'],
      summary: 'A queue is First-In-First-Out (FIFO): items join at the back and leave from the front.',
      analogy: 'A line at a ticket counter: the first person in line is served first.',
      explain: `| Operation | Meaning | Time |
|---|---|---|
| «enqueue(x)» | add at the back | O(1) |
| «dequeue()» | remove from the front | O(1) |
| «peek()» | look at the front | O(1) |

**Where queues appear:** task scheduling, printer jobs, message queues, **BFS** in graphs and trees, and buffering data streams.

| Language | Right tool |
|---|---|
| Python | «collections.deque» (append / popleft) |
| JavaScript | an array works for small queues («push» / «shift», but shift is O(n)) |
| Java | «Queue<Integer> q = new ArrayDeque<>();» (offer / poll) |
| C++ | «std::queue<int>» (push / front / pop) |

A **deque** (double-ended queue) supports O(1) add/remove at **both** ends. A **priority queue** dequeues the smallest or largest item first; see [heaps](ask:explain heap and priority queue).`,
      code: {
        python: `from collections import deque

q = deque()
q.append("A")       # enqueue
q.append("B")
q.append("C")
print(q.popleft())  # A  (dequeue from the front, O(1))
print(q[0])         # B  (peek)
print(len(q))       # 2`,
        java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Queue<String> q = new ArrayDeque<>();
        q.offer("A"); q.offer("B"); q.offer("C");
        System.out.println(q.poll());   // A
        System.out.println(q.peek());   // B
    }
}`,
        cpp: `#include <iostream>
#include <queue>
using namespace std;
int main() {
    queue<string> q;
    q.push("A"); q.push("B");
    cout << q.front() << endl;  // A
    q.pop();
    cout << q.front() << endl;  // B
}`,
        javascript: `const q = [];
q.push("A"); q.push("B"); q.push("C");
console.log(q.shift());   // "A"  (fine for small queues; O(n) for big ones)
console.log(q[0]);        // "B"`
      },
      mistakes: ['Python: using «list.pop(0)», which is O(n). Use «deque.popleft()».', 'Mixing up stack and queue order.', 'Java: «remove()»/«element()» throw on an empty queue, while «poll()»/«peek()» return null.'],
      related: ['stack', 'graphs', 'heap']
    },
    {
      id: 'hash-map', title: 'Hash Maps / Dictionaries', cat: 'Data Structures', level: 'Intermediate',
      aliases: ['hashmap', 'hash map', 'hash table', 'hashtable', 'dictionary', 'dictionaries', 'dict', 'map', 'key value', 'key-value', 'key value pair', 'hashing', 'hash function', 'collision', 'collisions', 'unordered_map', 'set', 'hashset', 'hash set', 'frequency count', 'counting frequency'],
      summary: 'A hash map stores key → value pairs and finds any value by its key in constant time on average.',
      analogy: 'A library catalogue: look up a book title (key) and instantly get its shelf number (value), instead of walking every shelf.',
      explain: `~~~python
ages = {"asha": 20, "ravi": 22}
ages["kiran"] = 19          # insert
print(ages["asha"])         # lookup, O(1) on average
~~~

### How it works
1. A **hash function** turns the key into a number, for example «hash("asha") → 9813…».
2. That number picks a **bucket** (index) in an internal array.
3. Two keys landing in the same bucket is a **collision**. It is handled by chaining (a small list per bucket) or by probing for the next free slot.

| Operation | Average | Worst |
|---|---|---|
| insert / lookup / delete | **O(1)** | O(n) (many collisions) |

**Typical uses:** counting frequencies, caching or memoization, de-duplicating with a **set**, indexing records by ID, and "two-sum" style lookups.

| Language | Map | Set |
|---|---|---|
| Python | «dict» | «set» |
| JavaScript | «Map» (or plain «{}») | «Set» |
| Java | «HashMap<K,V>» | «HashSet<T>» |
| C++ | «unordered_map<K,V>» | «unordered_set<T>» |`,
      deep: `### Keys must be hashable and immutable
Python lists can't be dict keys («TypeError: unhashable type: 'list'»). Use a tuple instead. In Java, custom key classes must override both «equals()» and «hashCode()» consistently.

### Ordered alternatives
- A **TreeMap** (Java) or **std::map** (C++) keeps keys sorted with O(log n) operations.
- Python «dict» preserves **insertion order** (3.7+), but that is not sorted order.

### Load factor and resizing
When the table gets too full (Java's default is 75%), it doubles in size and rehashes everything. That costs O(n) once but stays O(1) amortized.`,
      code: {
        python: `text = "the cat and the hat"
freq = {}
for word in text.split():
    freq[word] = freq.get(word, 0) + 1     # get() avoids KeyError
print(freq)   # {'the': 2, 'cat': 1, 'and': 1, 'hat': 1}

from collections import Counter
print(Counter(text.split()).most_common(1))  # [('the', 2)]`,
        javascript: `const words = "the cat and the hat".split(" ");
const freq = new Map();
for (const w of words) freq.set(w, (freq.get(w) || 0) + 1);
console.log(freq.get("the"));          // 2
console.log([...freq.entries()]);

const seen = new Set([1, 2, 2, 3]);
console.log(seen.size);                // 3`,
        java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        String[] words = "the cat and the hat".split(" ");
        Map<String, Integer> freq = new HashMap<>();
        for (String w : words) freq.put(w, freq.getOrDefault(w, 0) + 1);
        System.out.println(freq.get("the"));        // 2
        for (Map.Entry<String, Integer> e : freq.entrySet())
            System.out.println(e.getKey() + " -> " + e.getValue());
    }
}`,
        cpp: `#include <iostream>
#include <unordered_map>
#include <sstream>
using namespace std;
int main() {
    unordered_map<string, int> freq;
    stringstream ss("the cat and the hat");
    string w;
    while (ss >> w) freq[w]++;            // missing keys start at 0
    cout << freq["the"] << endl;          // 2
}`
      },
      mistakes: ['Python: «d[key]» on a missing key raises KeyError. Use «d.get(key, default)» or check «key in d».', 'Using mutable objects (lists) as keys.', 'Java: forgetting «hashCode()» when overriding «equals()» on key classes.', 'C++: «map[key]» silently inserts a default value when the key is missing. Use «find» or «count» to check.', 'Assuming maps are sorted.'],
      quiz: [
        { q: 'Average time to look up a key in a hash map?', o: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], a: 0, why: 'Hashing jumps directly to the right bucket.' }
      ],
      related: ['arrays-lists', 'big-o', 'two-pointers']
    },
    {
      id: 'trees', title: 'Trees & Binary Search Trees', cat: 'Data Structures', level: 'Intermediate',
      aliases: ['tree', 'trees', 'binary tree', 'binary search tree', 'bst', 'root node', 'leaf node', 'tree traversal', 'inorder', 'preorder', 'postorder', 'level order', 'height of tree', 'depth of tree', 'balanced tree', 'avl tree', 'red black tree'],
      summary: 'A tree is a hierarchy of nodes with one root, where each node can have children. In a binary search tree, smaller values go left and larger values go right.',
      analogy: 'The folder structure on your computer: one root folder, folders inside folders, and files as leaves.',
      explain: `~~~text
          8          ← root
        /   \\
       3     10
      / \\      \\
     1   6      14   ← leaves: 1, 6, 14
~~~
**Terms:** root, parent, child, **leaf** (no children), **height** (longest root-to-leaf path), subtree.

**Binary tree**: each node has at most 2 children.
**BST property**: everything in the left subtree is < the node, and everything in the right subtree is > the node. Searching is like binary search: go left or right at each step.

### Traversals
| Order | Visit | Result for the tree above |
|---|---|---|
| **Inorder** | left, node, right | 1 3 6 8 10 14 (**sorted** for a BST!) |
| **Preorder** | node, left, right | 8 3 1 6 10 14 |
| **Postorder** | left, right, node | 1 6 3 14 10 8 |
| **Level order** | level by level (BFS) | 8 3 10 1 6 14 |

| BST operation | Balanced | Skewed (like a list) |
|---|---|---|
| search / insert / delete | **O(log n)** | O(n) |`,
      code: {
        python: `class Node:
    def __init__(self, val):
        self.val, self.left, self.right = val, None, None

def insert(root, val):
    if root is None:
        return Node(val)
    if val < root.val:
        root.left = insert(root.left, val)
    else:
        root.right = insert(root.right, val)
    return root

def inorder(root):
    if root:
        inorder(root.left)
        print(root.val, end=" ")
        inorder(root.right)

def height(root):
    return 0 if root is None else 1 + max(height(root.left), height(root.right))

root = None
for v in [8, 3, 10, 1, 6, 14]:
    root = insert(root, v)
inorder(root)          # 1 3 6 8 10 14
print("\\nheight:", height(root))`,
        java: `class Node { int val; Node left, right; Node(int v) { val = v; } }

public class Main {
    static Node insert(Node root, int val) {
        if (root == null) return new Node(val);
        if (val < root.val) root.left = insert(root.left, val);
        else root.right = insert(root.right, val);
        return root;
    }
    static void inorder(Node r) {
        if (r == null) return;
        inorder(r.left); System.out.print(r.val + " "); inorder(r.right);
    }
    public static void main(String[] args) {
        Node root = null;
        for (int v : new int[]{8, 3, 10, 1, 6, 14}) root = insert(root, v);
        inorder(root);
    }
}`,
        cpp: `#include <iostream>
struct Node { int val; Node *left = nullptr, *right = nullptr; Node(int v) : val(v) {} };
Node* insert(Node* r, int v) {
    if (!r) return new Node(v);
    if (v < r->val) r->left = insert(r->left, v); else r->right = insert(r->right, v);
    return r;
}
bool contains(Node* r, int v) {
    while (r) { if (v == r->val) return true; r = v < r->val ? r->left : r->right; }
    return false;
}
int main() {
    Node* root = nullptr;
    for (int v : {8, 3, 10, 1, 6, 14}) root = insert(root, v);
    std::cout << contains(root, 6) << contains(root, 7);  // 10
}`,
        javascript: `class Node { constructor(v) { this.val = v; this.left = this.right = null; } }
function insert(root, v) {
  if (!root) return new Node(v);
  if (v < root.val) root.left = insert(root.left, v);
  else root.right = insert(root.right, v);
  return root;
}
const inorder = (r, out = []) => (r && (inorder(r.left, out), out.push(r.val), inorder(r.right, out)), out);
let root = null;
[8, 3, 10, 1, 6, 14].forEach(v => root = insert(root, v));
console.log(inorder(root));   // [1, 3, 6, 8, 10, 14]`
      },
      mistakes: ['Forgetting the «null» base case in recursive tree functions.', 'Not assigning the result of the recursive insert back («root.left = insert(...)»).', 'Inserting sorted data into a plain BST makes it a skewed O(n) "linked list".'],
      practice: ['Find the height of a binary tree.', 'Check whether a tree is a valid BST.', 'Level-order traversal using a queue.', 'Lowest common ancestor in a BST.'],
      quiz: [
        { q: 'Which traversal of a BST prints values in sorted order?', o: ['Preorder', 'Inorder', 'Postorder', 'Level order'], a: 1, why: 'Left subtree (smaller), node, right subtree (larger).' }
      ],
      related: ['recursion', 'graphs', 'heap', 'binary-search']
    },
    {
      id: 'graphs', title: 'Graphs, BFS & DFS', cat: 'Algorithms', level: 'Advanced',
      aliases: ['graph', 'graphs', 'bfs', 'dfs', 'breadth first search', 'depth first search', 'adjacency list', 'adjacency matrix', 'vertex', 'vertices', 'edge', 'edges', 'shortest path', 'dijkstra', 'cycle detection', 'connected components', 'graph traversal', 'topological sort'],
      summary: 'A graph is a set of vertices (nodes) connected by edges. It models networks such as maps, social networks, the web and course prerequisites.',
      analogy: 'A city map: intersections are vertices and roads are edges. One-way streets make it directed, and road lengths make it weighted.',
      explain: `**Kinds:** directed or undirected, weighted or unweighted, cyclic or acyclic (a DAG).

**Storing a graph:** an **adjacency list** (each node maps to a list of neighbours) is the usual choice and uses O(V + E) memory. An adjacency matrix uses O(V²).

### BFS vs DFS
| | BFS | DFS |
|---|---|---|
| Uses | **queue** | **stack** / recursion |
| Explores | level by level (nearest first) | as deep as possible, then backtracks |
| Finds | **shortest path in unweighted graphs** | cycles, components, topological order, mazes |
| Time | O(V + E) | O(V + E) |

> [!WARNING] Always track visited nodes
> Graphs can have cycles. Without a «visited» set you will loop forever.

For **weighted** shortest paths use **Dijkstra's algorithm** (a priority queue, O((V+E) log V)).`,
      code: {
        python: `from collections import deque

graph = {
    'A': ['B', 'C'],
    'B': ['D'],
    'C': ['D', 'E'],
    'D': ['F'],
    'E': ['F'],
    'F': []
}

def bfs(start):
    visited, order = {start}, []
    q = deque([start])
    while q:
        node = q.popleft()
        order.append(node)
        for nb in graph[node]:
            if nb not in visited:
                visited.add(nb)
                q.append(nb)
    return order

def dfs(node, visited=None):
    if visited is None:
        visited = []
    visited.append(node)
    for nb in graph[node]:
        if nb not in visited:
            dfs(nb, visited)
    return visited

print("BFS:", bfs('A'))   # A B C D E F
print("DFS:", dfs('A'))   # A B D F C E`,
        java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Map<Integer, List<Integer>> g = new HashMap<>();
        int[][] edges = {{0,1},{0,2},{1,3},{2,3},{3,4}};
        for (int[] e : edges) {
            g.computeIfAbsent(e[0], k -> new ArrayList<>()).add(e[1]);
            g.computeIfAbsent(e[1], k -> new ArrayList<>()).add(e[0]);
        }
        Set<Integer> seen = new HashSet<>(List.of(0));
        Deque<Integer> q = new ArrayDeque<>(List.of(0));
        while (!q.isEmpty()) {
            int u = q.poll();
            System.out.print(u + " ");
            for (int v : g.getOrDefault(u, List.of()))
                if (seen.add(v)) q.offer(v);
        }
    }
}`,
        cpp: `#include <iostream>
#include <vector>
#include <queue>
using namespace std;
int main() {
    int n = 5;
    vector<vector<int>> adj(n);
    auto addEdge = [&](int u, int v) { adj[u].push_back(v); adj[v].push_back(u); };
    addEdge(0,1); addEdge(0,2); addEdge(1,3); addEdge(3,4);
    vector<int> dist(n, -1);
    queue<int> q; q.push(0); dist[0] = 0;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u]) if (dist[v] == -1) { dist[v] = dist[u] + 1; q.push(v); }
    }
    for (int i = 0; i < n; i++) cout << i << ": " << dist[i] << endl;  // shortest hops from 0
}`,
        javascript: `const graph = { A: ["B", "C"], B: ["D"], C: ["D"], D: [] };
function dfs(node, visited = new Set()) {
  visited.add(node);
  for (const nb of graph[node]) if (!visited.has(nb)) dfs(nb, visited);
  return [...visited];
}
console.log(dfs("A"));  // ["A", "B", "D", "C"]`
      },
      mistakes: ['No visited set, which causes infinite loops on cycles.', 'Marking a node visited only when it is dequeued, so it gets enqueued many times. Mark it when you enqueue it.', 'Using DFS to find the shortest path in an unweighted graph. Use BFS.', 'Forgetting that undirected edges must be added in both directions.'],
      practice: ['Count islands in a grid (DFS/BFS).', 'Shortest path in a maze with BFS.', 'Detect a cycle in a directed graph.', 'Course schedule (topological sort).'],
      quiz: [
        { q: 'Which traversal finds the shortest path (fewest edges) in an unweighted graph?', o: ['DFS', 'BFS', 'Inorder', 'Binary search'], a: 1, why: 'BFS explores nodes in order of distance from the start.' }
      ],
      related: ['trees', 'queue', 'stack', 'recursion', 'heap']
    },
    {
      id: 'sorting', title: 'Sorting Algorithms', cat: 'Algorithms', level: 'Intermediate',
      aliases: ['sort', 'sorting', 'sorting algorithms', 'bubble sort', 'selection sort', 'insertion sort', 'merge sort', 'mergesort', 'quick sort', 'quicksort', 'heap sort', 'counting sort', 'stable sort', 'sort an array', 'which sorting algorithm'],
      summary: 'Sorting arranges elements in order. Different algorithms trade off simplicity, speed and memory.',
      explain: `| Algorithm | Best | Average | Worst | Extra space | Stable | Idea |
|---|---|---|---|---|---|---|
| Bubble | O(n) | O(n²) | O(n²) | O(1) | ✅ | swap adjacent pairs that are out of order |
| Selection | O(n²) | O(n²) | O(n²) | O(1) | ❌ | pick the minimum and put it in front |
| Insertion | O(n) | O(n²) | O(n²) | O(1) | ✅ | insert each item into the sorted prefix (great when nearly sorted) |
| **Merge** | O(n log n) | O(n log n) | O(n log n) | O(n) | ✅ | split in half, sort each half, merge |
| **Quick** | O(n log n) | O(n log n) | O(n²) | O(log n) | ❌ | partition around a pivot |
| Heap | O(n log n) | O(n log n) | O(n log n) | O(1) | ❌ | repeatedly take the max from a heap |
| Counting | O(n + k) | O(n + k) | O(n + k) | O(k) | ✅ | count occurrences (small integer range) |

**Stable** means equal elements keep their original order. That matters when sorting records by one field after another.

> [!TIP] In real code, use the built-in sort
> Python «sorted()» / «list.sort()» (Timsort), Java «Arrays.sort» / «Collections.sort», C++ «std::sort» and JS «arr.sort((a, b) => a - b)» are all O(n log n) and heavily optimised.`,
      deep: `### Merge sort: divide and conquer
1. **Divide** the array into two halves.
2. **Conquer**: recursively sort each half.
3. **Combine**: merge two sorted halves in O(n) with two pointers.
The recurrence T(n) = 2T(n/2) + O(n) solves to O(n log n).

### Quick sort: partitioning
Choose a pivot and move smaller elements to its left and larger ones to its right, then recurse on each side. Its worst case is O(n²) when the pivot is always the smallest or largest; a random pivot avoids that in practice.

### The lower bound
Any sort that works by *comparing* elements needs Ω(n log n) comparisons in the worst case. Counting and radix sort beat this only because they don't compare.`,
      code: {
        python: `def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left, right = merge_sort(arr[:mid]), merge_sort(arr[mid:])
    merged, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            merged.append(left[i]); i += 1
        else:
            merged.append(right[j]); j += 1
    return merged + left[i:] + right[j:]

print(merge_sort([5, 2, 9, 1, 5, 6]))     # [1, 2, 5, 5, 6, 9]

students = [("asha", 82), ("ravi", 91)]
print(sorted(students, key=lambda s: s[1], reverse=True))  # sort by marks`,
        javascript: `function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid)), right = mergeSort(arr.slice(mid));
  const out = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) out.push(left[i] <= right[j] ? left[i++] : right[j++]);
  return out.concat(left.slice(i), right.slice(j));
}
console.log(mergeSort([5, 2, 9, 1]));
console.log([10, 9, 100].sort());               // [10, 100, 9]  string sort!
console.log([10, 9, 100].sort((a, b) => a - b)); // [9, 10, 100]`,
        java: `import java.util.*;

public class Main {
    static void bubbleSort(int[] a) {
        for (int i = 0; i < a.length - 1; i++) {
            boolean swapped = false;
            for (int j = 0; j < a.length - 1 - i; j++) {
                if (a[j] > a[j + 1]) {
                    int t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;
                    swapped = true;
                }
            }
            if (!swapped) break;           // already sorted -> O(n) best case
        }
    }
    public static void main(String[] args) {
        int[] a = {5, 2, 9, 1};
        bubbleSort(a);
        System.out.println(Arrays.toString(a));
        Integer[] b = {5, 2, 9, 1};
        Arrays.sort(b, Collections.reverseOrder());   // descending
        System.out.println(Arrays.toString(b));
    }
}`,
        cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int partition(vector<int>& a, int lo, int hi) {
    int pivot = a[hi], i = lo;
    for (int j = lo; j < hi; j++) if (a[j] < pivot) swap(a[i++], a[j]);
    swap(a[i], a[hi]);
    return i;
}
void quickSort(vector<int>& a, int lo, int hi) {
    if (lo >= hi) return;
    int p = partition(a, lo, hi);
    quickSort(a, lo, p - 1); quickSort(a, p + 1, hi);
}
int main() {
    vector<int> v = {5, 2, 9, 1, 7};
    quickSort(v, 0, v.size() - 1);
    for (int x : v) cout << x << " ";
    sort(v.begin(), v.end(), greater<int>());   // built-in, descending
}`
      },
      mistakes: ['JavaScript: «arr.sort()» without a comparator sorts numbers as strings.', 'Python: «list.sort()» returns «None». Use «sorted(list)» if you need the result.', 'Off-by-one errors in the inner loop bounds of bubble sort.', 'Writing your own O(n²) sort for large inputs instead of using the built-in.'],
      quiz: [
        { q: 'Which sort guarantees O(n log n) in the worst case?', o: ['Quick sort', 'Merge sort', 'Bubble sort', 'Insertion sort'], a: 1, why: 'Merge sort always splits evenly; quick sort can degrade to O(n²).' },
        { q: 'What does «[10, 9, 100].sort()» return in JavaScript?', o: ['[9, 10, 100]', '[10, 100, 9]', '[100, 10, 9]', 'Error'], a: 1, why: 'Default sort compares elements as strings.' }
      ],
      related: ['big-o', 'recursion', 'binary-search', 'heap']
    },
    {
      id: 'binary-search', title: 'Binary Search', cat: 'Algorithms', level: 'Beginner',
      aliases: ['binary search', 'binary search algorithm', 'bisect', 'lower bound', 'upper bound', 'search sorted array', 'search in sorted array', 'divide and conquer search', 'binary search on answer'],
      summary: 'Binary search finds an item in a sorted array by repeatedly halving the search range, which takes O(log n) time.',
      analogy: 'The "guess my number between 1 and 100" game: always guess the middle. "Too high" eliminates the top half. You need at most 7 guesses.',
      explain: `**Requirement:** the data must be **sorted**.

1. Set «lo = 0» and «hi = n - 1».
2. While «lo <= hi»: compute «mid = (lo + hi) // 2».
3. If «arr[mid] == target», you found it.
4. If «arr[mid] < target», the target is on the right: «lo = mid + 1».
5. Otherwise it is on the left: «hi = mid - 1».
6. If the loop ends, the target is not present.

**Trace** searching for 23 in «[2, 5, 8, 12, 16, 23, 38, 56]»:
| lo | hi | mid | arr[mid] | action |
|---|---|---|---|---|
| 0 | 7 | 3 | 12 | 12 < 23 → go right |
| 4 | 7 | 5 | 23 | found at index 5 ✅ |`,
      deep: `### Variants
- **First occurrence / lower bound**: when you find a match, record it and keep searching **left** («hi = mid - 1»).
- **Search on the answer**: binary search over the *answer space* (for example "minimum capacity to ship within D days") when you can test whether an answer works.
- Built-ins: Python «bisect.bisect_left», Java «Arrays.binarySearch», C++ «lower_bound» / «binary_search».

### Overflow
In Java/C/C++, «(lo + hi) / 2» can overflow for huge indexes. Use «lo + (hi - lo) / 2».`,
      code: {
        python: `def binary_search(arr, target):
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1

print(binary_search([2, 5, 8, 12, 16, 23, 38], 23))   # 5`,
        javascript: `function binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}
console.log(binarySearch([2, 5, 8, 12, 16, 23], 16)); // 4`,
        java: `public class Main {
    static int binarySearch(int[] a, int target) {
        int lo = 0, hi = a.length - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;     // overflow-safe
            if (a[mid] == target) return mid;
            if (a[mid] < target) lo = mid + 1; else hi = mid - 1;
        }
        return -1;
    }
    public static void main(String[] args) {
        System.out.println(binarySearch(new int[]{2, 5, 8, 12, 16, 23}, 12));  // 3
    }
}`,
        cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    vector<int> a = {2, 5, 8, 12, 16, 23};
    int lo = 0, hi = a.size() - 1, target = 16, ans = -1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == target) { ans = mid; break; }
        if (a[mid] < target) lo = mid + 1; else hi = mid - 1;
    }
    cout << ans << " " << binary_search(a.begin(), a.end(), 23) << endl;   // 4 1
}`,
        c: `#include <stdio.h>
int binarySearch(int a[], int n, int target) {
    int lo = 0, hi = n - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == target) return mid;
        if (a[mid] < target) lo = mid + 1; else hi = mid - 1;
    }
    return -1;
}
int main() {
    int a[] = {2, 5, 8, 12, 16, 23};
    printf("%d\\n", binarySearch(a, 6, 23));   // 5
    return 0;
}`
      },
      complexity: 'O(log n) time and O(1) space (iterative).',
      mistakes: ['Running it on an **unsorted** array.', 'An infinite loop from writing «lo = mid» instead of «lo = mid + 1».', 'Using «lo < hi» with the «hi = mid - 1» variant, which skips the last element.', 'Integer overflow in «(lo + hi) / 2» for very large arrays.'],
      quiz: [
        { q: 'Maximum comparisons to find an item among 1,000,000 sorted items?', o: ['~20', '~1000', '~500,000', '1,000,000'], a: 0, why: 'log₂(1,000,000) ≈ 20.' }
      ],
      related: ['big-o', 'sorting', 'arrays-lists', 'two-pointers']
    },
    {
      id: 'dynamic-programming', title: 'Dynamic Programming', cat: 'Algorithms', level: 'Advanced',
      aliases: ['dp', 'dynamic programming', 'memoization', 'memoisation', 'tabulation', 'overlapping subproblems', 'optimal substructure', 'knapsack', '0/1 knapsack', 'top down', 'bottom up', 'lcs', 'longest common subsequence', 'coin change', 'climbing stairs'],
      summary: 'Dynamic programming solves a big problem by breaking it into overlapping smaller subproblems, solving each one only once and storing the result.',
      analogy: 'Writing answers in a notebook: if someone asks "what is 7 × 8?" twice, you look it up the second time instead of working it out again.',
      explain: `DP applies when a problem has:
1. **Overlapping subproblems**: the same smaller problem is solved repeatedly.
2. **Optimal substructure**: the best answer can be built from the best answers to subproblems.

### Two styles
| | Top-down (memoization) | Bottom-up (tabulation) |
|---|---|---|
| How | recursion + cache | fill a table with loops |
| Order | natural, on demand | you choose the order |
| Risk | recursion depth | none; easy to save space |

### A 5-step recipe
1. **State**: what does «dp[i]» mean? ("number of ways to reach step i")
2. **Recurrence**: how does «dp[i]» depend on smaller states? («dp[i] = dp[i-1] + dp[i-2]»)
3. **Base cases**: «dp[0] = 1», «dp[1] = 1».
4. **Order**: compute smaller i first.
5. **Answer**: «dp[n]».

**Fibonacci:** naive recursion is O(2ⁿ). With DP it is **O(n)**.`,
      code: {
        python: `from functools import lru_cache

# Top-down: climbing stairs (1 or 2 steps at a time)
@lru_cache(maxsize=None)
def ways(n):
    if n <= 1:
        return 1
    return ways(n - 1) + ways(n - 2)

# Bottom-up: coin change, the fewest coins that make 'amount'
def coin_change(coins, amount):
    INF = float('inf')
    dp = [0] + [INF] * amount
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a:
                dp[a] = min(dp[a], dp[a - c] + 1)
    return dp[amount] if dp[amount] != INF else -1

print(ways(10))                      # 89
print(coin_change([1, 2, 5], 11))    # 3  (5 + 5 + 1)`,
        javascript: `function fib(n, memo = {}) {
  if (n < 2) return n;
  if (memo[n] !== undefined) return memo[n];
  return (memo[n] = fib(n - 1, memo) + fib(n - 2, memo));
}
function fibTab(n) {               // O(1) space bottom-up
  let [a, b] = [0, 1];
  for (let i = 0; i < n; i++) [a, b] = [b, a + b];
  return a;
}
console.log(fib(50), fibTab(50));`,
        java: `public class Main {
    // Longest Common Subsequence of two strings
    static int lcs(String a, String b) {
        int[][] dp = new int[a.length() + 1][b.length() + 1];
        for (int i = 1; i <= a.length(); i++)
            for (int j = 1; j <= b.length(); j++)
                dp[i][j] = a.charAt(i - 1) == b.charAt(j - 1)
                        ? dp[i - 1][j - 1] + 1
                        : Math.max(dp[i - 1][j], dp[i][j - 1]);
        return dp[a.length()][b.length()];
    }
    public static void main(String[] args) {
        System.out.println(lcs("ABCBDAB", "BDCABA"));  // 4
    }
}`,
        cpp: `#include <iostream>
#include <vector>
using namespace std;
// 0/1 knapsack: max value with capacity W
int main() {
    vector<int> wt = {1, 3, 4, 5}, val = {1, 4, 5, 7};
    int W = 7;
    vector<int> dp(W + 1, 0);
    for (size_t i = 0; i < wt.size(); i++)
        for (int w = W; w >= wt[i]; w--)          // backwards = each item used once
            dp[w] = max(dp[w], dp[w - wt[i]] + val[i]);
    cout << dp[W] << endl;   // 9
}`
      },
      mistakes: ['Not defining clearly what «dp[i]» means before you start coding.', 'Wrong base cases, which spread errors through the whole table.', 'Filling the table in the wrong order.', '0/1 knapsack: iterating capacity forwards lets an item be reused.'],
      practice: ['Climbing stairs', 'House robber', 'Coin change', 'Longest increasing subsequence', '0/1 knapsack', 'Edit distance'],
      quiz: [
        { q: 'Memoization is best described as…', o: ['Sorting first', 'Caching results of subproblems', 'Using a queue', 'Greedy choice'], a: 1, why: 'Each subproblem is computed once and then looked up.' }
      ],
      related: ['recursion', 'big-o', 'hash-map']
    },
    {
      id: 'two-pointers', title: 'Two Pointers & Sliding Window', cat: 'Algorithms', level: 'Intermediate',
      aliases: ['two pointers', 'two pointer', 'two-pointer', 'sliding window', 'window technique', 'fast and slow pointers', 'pair sum', 'pair with given sum', 'maximum sum subarray', 'longest substring without repeating characters'],
      summary: 'These techniques walk one or two indexes through an array to avoid nested loops, often turning O(n²) into O(n).',
      explain: `### Two pointers
Place pointers at both ends (or both at the start) and move them according to a rule.
**Pair with sum = target in a sorted array:**
- If «arr[l] + arr[r]» is too small, move «l» right.
- If it is too big, move «r» left.
- Each step discards one element, so the whole thing is O(n).

Also used for: reversing in place, removing duplicates, palindrome checks, and merging sorted arrays.

### Sliding window
Keep a "window" «[left, right]» and slide it instead of recomputing from scratch.
- **Fixed size k**: add the element entering the window and subtract the one leaving. That is O(n) instead of O(n·k).
- **Variable size**: expand «right», and shrink «left» while the window is invalid (for example the longest substring with no repeated characters).`,
      code: {
        python: `def pair_sum(arr, target):          # arr must be sorted
    l, r = 0, len(arr) - 1
    while l < r:
        s = arr[l] + arr[r]
        if s == target:
            return arr[l], arr[r]
        if s < target:
            l += 1
        else:
            r -= 1
    return None

def max_sum_k(arr, k):              # fixed sliding window
    window = sum(arr[:k])
    best = window
    for i in range(k, len(arr)):
        window += arr[i] - arr[i - k]
        best = max(best, window)
    return best

def longest_unique(s):              # variable window
    seen, left, best = {}, 0, 0
    for right, ch in enumerate(s):
        if ch in seen and seen[ch] >= left:
            left = seen[ch] + 1
        seen[ch] = right
        best = max(best, right - left + 1)
    return best

print(pair_sum([1, 3, 4, 6, 9], 10))          # (1, 9)
print(max_sum_k([2, 1, 5, 1, 3, 2], 3))       # 9
print(longest_unique("abcabcbb"))             # 3`,
        javascript: `function isPalindrome(s) {
  s = s.toLowerCase().replace(/[^a-z0-9]/g, "");
  let l = 0, r = s.length - 1;
  while (l < r) if (s[l++] !== s[r--]) return false;
  return true;
}
console.log(isPalindrome("A man, a plan, a canal: Panama")); // true`,
        java: `public class Main {
    static int maxSumK(int[] a, int k) {
        int window = 0;
        for (int i = 0; i < k; i++) window += a[i];
        int best = window;
        for (int i = k; i < a.length; i++) {
            window += a[i] - a[i - k];
            best = Math.max(best, window);
        }
        return best;
    }
    public static void main(String[] args) {
        System.out.println(maxSumK(new int[]{2, 1, 5, 1, 3, 2}, 3));  // 9
    }
}`
      },
      mistakes: ['Using two pointers on unsorted data when the logic depends on sorting.', 'Forgetting to shrink the window, or shrinking too far.', 'Off-by-one errors in the window length («right - left + 1»).'],
      related: ['arrays-lists', 'hash-map', 'big-o', 'binary-search']
    },
    {
      id: 'heap', title: 'Heaps & Priority Queues', cat: 'Data Structures', level: 'Intermediate',
      aliases: ['heap', 'heaps', 'priority queue', 'priorityqueue', 'min heap', 'max heap', 'heapq', 'heapify', 'top k', 'kth largest', 'binary heap'],
      summary: 'A heap is a tree-based structure that always gives fast access to the smallest element (min-heap) or the largest (max-heap).',
      analogy: 'A hospital emergency room: patients aren\'t seen in arrival order but by priority. The most urgent case is always next.',
      explain: `| Operation | Time |
|---|---|
| peek min/max | **O(1)** |
| push | O(log n) |
| pop min/max | O(log n) |
| build heap from n items | O(n) |

A binary heap is stored in a plain **array**: for the node at index «i», its children are at «2i+1» and «2i+2», and its parent is at «(i-1)//2».

**Uses:** top-K problems, scheduling, Dijkstra's shortest path, merging K sorted lists, and finding a running median.

| Language | Default | Max-heap trick |
|---|---|---|
| Python «heapq» | min-heap | push negative values |
| Java «PriorityQueue» | min-heap | «new PriorityQueue<>(Collections.reverseOrder())» |
| C++ «priority_queue» | **max**-heap | «priority_queue<int, vector<int>, greater<int>>» for min |`,
      code: {
        python: `import heapq

nums = [5, 1, 8, 3, 9, 2]
heapq.heapify(nums)              # O(n), now a min-heap
print(heapq.heappop(nums))       # 1
heapq.heappush(nums, 0)
print(nums[0])                   # 0 (peek)

def k_largest(arr, k):           # keep a min-heap of size k
    h = []
    for x in arr:
        heapq.heappush(h, x)
        if len(h) > k:
            heapq.heappop(h)
    return sorted(h, reverse=True)

print(k_largest([5, 1, 8, 3, 9, 2], 3))   # [9, 8, 5]`,
        java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        PriorityQueue<Integer> minHeap = new PriorityQueue<>();
        PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
        for (int x : new int[]{5, 1, 8, 3}) { minHeap.offer(x); maxHeap.offer(x); }
        System.out.println(minHeap.poll() + " " + maxHeap.poll());   // 1 8
    }
}`,
        cpp: `#include <iostream>
#include <queue>
#include <vector>
using namespace std;
int main() {
    priority_queue<int> maxH;                               // max-heap
    priority_queue<int, vector<int>, greater<int>> minH;    // min-heap
    for (int x : {5, 1, 8, 3}) { maxH.push(x); minH.push(x); }
    cout << maxH.top() << " " << minH.top() << endl;        // 8 1
}`
      },
      mistakes: ['Assuming the heap array is fully sorted. Only the root is guaranteed to be the min/max.', 'Python: forgetting that heapq is a min-heap only.', 'C++: forgetting that priority_queue is a max-heap by default.'],
      related: ['queue', 'trees', 'sorting', 'graphs']
    }
  ]);
})();
