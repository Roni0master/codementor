/* CodeMentor KB — comparisons ("difference between X and Y") and general FAQs */
(function () {
  'use strict';
  const KB = window.CM.kb;

  KB.add('compares', [
    {
      id: 'eq-vs-strict', title: '«==» vs «===» in JavaScript', terms: [['==', 'double equals', 'loose equality', 'loose equal'], ['===', 'triple equals', 'strict equality', 'strict equal']],
      body: `| | «==» (loose) | «===» (strict) |
|---|---|---|
| Converts types first? | ✅ yes (coercion) | ❌ no |
| «5 == "5"» | «true» | «false» |
| «0 == ""» | «true» 😬 | «false» |
| «null == undefined» | «true» | «false» |

«===» checks that the **value and the type** are both the same. «==» first tries to convert both sides to a common type, which leads to surprising results.`,
      code: { javascript: `console.log(1 == "1");    // true  (string converted to number)
console.log(1 === "1");   // false (different types)
console.log([] == false); // true  (!?)
console.log(null == undefined, null === undefined); // true false` },
      verdict: 'Always use «===» and «!==». The only common exception is «x == null», which checks for both null and undefined.',
      related: ['operators', 'type-conversion']
    },
    {
      id: 'assign-vs-equal', title: '«=» vs «==»', terms: [['=', 'single equals', 'assignment'], ['==', 'double equals', 'comparison', 'equality']],
      body: `| | «=» | «==» |
|---|---|---|
| Name | assignment | comparison (equality) |
| Meaning | "store this value in the variable" | "are these two values equal?" |
| Result | the assigned value | «true» / «false» |
| Example | «x = 5» | «if (x == 5)» |

Writing «if (x = 5)» in C/C++/JS **assigns** 5 and is always true. That is a classic bug. Python and Java reject it with a syntax or compile error, which is actually helpful.`,
      verdict: 'Use «=» to store and «==» to compare (and «===» in JavaScript).',
      related: ['operators', 'conditionals']
    },
    {
      id: 'let-var-const', title: '«var» vs «let» vs «const»', terms: [['var'], ['let', 'const']],
      body: `| | «var» | «let» | «const» |
|---|---|---|---|
| Scope | function | block | block |
| Hoisting | initialised as «undefined» | TDZ (error before the declaration) | TDZ |
| Re-declare | ✅ | ❌ | ❌ |
| Re-assign | ✅ | ✅ | ❌ |`,
      code: { javascript: `for (var i = 0; i < 3; i++) setTimeout(() => console.log("var", i));  // 3 3 3
for (let j = 0; j < 3; j++) setTimeout(() => console.log("let", j));  // 0 1 2
const user = { name: "A" };
user.name = "B";      // allowed: the object is mutable
// user = {};         // TypeError` },
      verdict: 'Use «const» by default, «let» when the variable must be reassigned, and avoid «var».',
      related: ['js-hoisting', 'scope', 'js-closures']
    },
    {
      id: 'null-undefined', title: '«null» vs «undefined»', terms: [['null'], ['undefined']],
      body: `| | «undefined» | «null» |
|---|---|---|
| Meaning | "no value has been assigned yet" | "intentionally empty" |
| Who sets it | JavaScript, automatically | you, the programmer |
| «typeof» | «"undefined"» | «"object"» (a historic bug) |
| Examples | uninitialised variables, missing properties, functions without return | «user = null» after logout |`,
      code: { javascript: `let a;              // undefined
const obj = {};
console.log(obj.missing);   // undefined
let user = null;           // deliberately empty
console.log(a ?? "default", user ?? "nobody");` },
      verdict: 'Let JS produce «undefined». Use «null» when *you* want to say "empty on purpose".',
      related: ['variables', 'js-hoisting']
    },
    {
      id: 'list-tuple', title: 'List vs Tuple (Python)', terms: [['list', 'lists'], ['tuple', 'tuples']],
      body: `| | «list» | «tuple» |
|---|---|---|
| Syntax | «[1, 2, 3]» | «(1, 2, 3)» |
| Mutable? | ✅ can change | ❌ immutable |
| Methods | many (append, remove, sort…) | only count and index |
| Can be a dict key? | ❌ | ✅ (if its items are hashable) |
| Speed and memory | slightly more | slightly less |
| Typical use | a collection that grows or changes | a fixed record, e.g. «(x, y)» or «(name, age)» |`,
      code: { python: `point = (3, 4)          # tuple: fixed pair
scores = [70, 85]       # list: will change
scores.append(90)
locations = {(12.9, 77.6): "Bengaluru"}   # tuple as a dict key
single = (5,)           # one-element tuple needs a comma` },
      verdict: 'Use a list for collections of similar items that change. Use a tuple for fixed groups of related values.',
      related: ['arrays-lists', 'python-mutability']
    },
    {
      id: 'array-linkedlist', title: 'Array vs Linked List', terms: [['array', 'arrays', 'arraylist', 'vector', 'list'], ['linked list', 'linkedlist']],
      body: `| | Array / ArrayList | Linked list |
|---|---|---|
| Memory | contiguous block | nodes scattered, linked by pointers |
| Access by index | **O(1)** | O(n) |
| Insert/delete at front | O(n) (shifting) | **O(1)** |
| Insert/delete in the middle | O(n) | O(1) once you are at the node (finding it is O(n)) |
| Extra memory | none (maybe spare capacity) | one or two pointers per node |
| Cache-friendly | ✅ very | ❌ |`,
      verdict: 'Arrays and dynamic arrays are the right default almost always. Linked lists win only for frequent inserts/removes at known positions, or as building blocks (queues, LRU caches).',
      related: ['arrays-lists', 'linked-list', 'big-o']
    },
    {
      id: 'stack-queue', title: 'Stack vs Queue', terms: [['stack', 'stacks', 'lifo'], ['queue', 'queues', 'fifo']],
      body: `| | Stack | Queue |
|---|---|---|
| Order | **LIFO**: last in, first out | **FIFO**: first in, first out |
| Add | «push» (top) | «enqueue» (back) |
| Remove | «pop» (top) | «dequeue» (front) |
| Analogy | a stack of plates | a line at a counter |
| Used in | undo, function calls, DFS, bracket matching | scheduling, buffering, BFS |`,
      verdict: 'Use a stack when you need the most recent item first, and a queue when you need to process items in arrival order.',
      related: ['stack', 'queue', 'graphs']
    },
    {
      id: 'class-object', title: 'Class vs Object', terms: [['class', 'classes'], ['object', 'objects', 'instance']],
      body: `| | Class | Object |
|---|---|---|
| What | a blueprint or template | a concrete thing built from it |
| Memory | defined once | each object has its own memory |
| Example | «class Car» | «myCar = Car("red")» |
| Analogy | a house plan | an actual house |`,
      code: { python: `class Car:                       # class = blueprint
    def __init__(self, color):
        self.color = color

a = Car("red")                   # object 1
b = Car("blue")                  # object 2
print(a.color, b.color)` },
      verdict: 'You write a class once and create as many objects from it as you need.',
      related: ['classes-objects', 'oop']
    },
    {
      id: 'abstract-interface', title: 'Abstract class vs Interface', terms: [['abstract class', 'abstract classes', 'abstract'], ['interface', 'interfaces']],
      body: `| | Abstract class | Interface |
|---|---|---|
| Fields and state | ✅ | ❌ constants only |
| Constructors | ✅ | ❌ |
| Method bodies | ✅ | only «default»/«static» (Java 8+) |
| Inheritance | a class «extends» **one** | a class «implements» **many** |
| Relationship | "is-a" with shared code | "can-do" capability |`,
      verdict: 'Use an interface to define a capability shared across unrelated classes. Use an abstract class to share code and state among closely related classes.',
      related: ['interfaces-abstract', 'inheritance']
    },
    {
      id: 'overload-override', title: 'Method Overloading vs Overriding', terms: [['overloading', 'overload', 'method overloading'], ['overriding', 'override', 'method overriding']],
      body: `| | Overloading | Overriding |
|---|---|---|
| Where | the same class | a subclass redefines a parent method |
| Name | same | same |
| Parameters | **different** | **same** |
| Resolved | compile time (static) | runtime (dynamic dispatch) |
| Polymorphism type | compile-time | runtime |
| Java annotation | — | «@Override» |`,
      code: { java: `class Calc {
    int add(int a, int b) { return a + b; }            // overloads
    double add(double a, double b) { return a + b; }
}
class Animal { String sound() { return "..."; } }
class Cat extends Animal {
    @Override String sound() { return "Meow"; }        // override
}` },
      verdict: 'Overloading means "same name, different inputs". Overriding means "same method, different behaviour in a child class".',
      related: ['polymorphism', 'inheritance']
    },
    {
      id: 'compiler-interpreter', title: 'Compiler vs Interpreter', terms: [['compiler', 'compiled', 'compiled language'], ['interpreter', 'interpreted', 'interpreted language']],
      body: `| | Compiler | Interpreter |
|---|---|---|
| Translates | the whole program, before it runs | one statement at a time, while it runs |
| Output | an executable or bytecode | no separate file |
| Errors | reported all together at compile time | appear when that line runs |
| Speed | faster at runtime | slower, but quicker to start iterating |
| Examples | C, C++, Rust, Go (Java → bytecode) | Python, Ruby, JS (with JIT) |`,
      verdict: 'Most modern languages mix both: Java compiles to bytecode and then JIT-compiles, and Python compiles to bytecode that is then interpreted.',
      related: ['compilation']
    },
    {
      id: 'process-thread', title: 'Process vs Thread', terms: [['process', 'processes'], ['thread', 'threads', 'multithreading']],
      body: `| | Process | Thread |
|---|---|---|
| What | an independent running program | a path of execution inside a process |
| Memory | its own separate address space | shares the process's memory |
| Creation cost | heavy | light |
| Communication | IPC (pipes, sockets) | shared variables (needs locks) |
| A crash affects | only that process | the whole process |`,
      verdict: 'Threads are cheap and share memory, but you must synchronise access to it. Processes are isolated and safer, but heavier.',
      related: ['memory-management']
    },
    {
      id: 'is-vs-eq', title: '«is» vs «==» in Python', terms: [['is'], ['==', 'double equals', 'equals']],
      body: `| | «==» | «is» |
|---|---|---|
| Checks | **value** equality | **identity** (the same object in memory) |
| «[1] == [1]» | «True» | «False»: two different lists |
| Use for | comparing values | «None», «True», «False» (singletons) |`,
      code: { python: `a = [1, 2]
b = [1, 2]
c = a
print(a == b, a is b, a is c)   # True False True
x = None
if x is None:                   # the correct way to check for None
    print("empty")` },
      verdict: 'Use «==» for values and «is» only for «None» (and other singletons).',
      related: ['python-mutability', 'operators']
    },
    {
      id: 'pass-value-reference', title: 'Pass by Value vs Pass by Reference', terms: [['pass by value', 'call by value'], ['pass by reference', 'call by reference']],
      body: `| | Pass by value | Pass by reference |
|---|---|---|
| The function receives | a **copy** of the value | an **alias** to the caller's variable |
| Changes inside affect the caller? | ❌ | ✅ |
| C | everything (use pointers to simulate references) | — |
| C++ | default | «void f(int &x)» |
| Java | **always by value**, but for objects the value *is a reference* | — |
| Python / JS | "pass by object reference": mutating the object is visible, rebinding the name is not | — |`,
      code: { python: `def change(lst, n):
    lst.append(4)    # mutates the shared object -> caller sees it
    n = 100          # rebinds the local name -> caller does not see it

nums, x = [1, 2, 3], 5
change(nums, x)
print(nums, x)       # [1, 2, 3, 4] 5`, cpp: `void byValue(int x) { x = 99; }        // caller unchanged
void byRef(int &x)  { x = 99; }        // caller changed
int main() { int a = 1, b = 1; byValue(a); byRef(b); /* a=1, b=99 */ }` },
      verdict: 'Ask two questions: does the function get a copy or the same object, and is it mutating the object or reassigning the name?',
      related: ['functions', 'pointers', 'python-mutability']
    },
    {
      id: 'bfs-dfs', title: 'BFS vs DFS', terms: [['bfs', 'breadth first search', 'breadth-first'], ['dfs', 'depth first search', 'depth-first']],
      body: `| | BFS | DFS |
|---|---|---|
| Data structure | queue | stack / recursion |
| Explores | level by level | one branch to the end, then backtracks |
| Shortest path (unweighted) | ✅ guaranteed | ❌ |
| Memory | can be large (a whole level) | proportional to depth |
| Good for | shortest paths, nearest neighbours | cycles, topological sort, mazes, connected components |
| Time | O(V + E) | O(V + E) |`,
      verdict: 'Use BFS when the question is "how many steps at minimum?". Use DFS to explore everything or to detect structure.',
      related: ['graphs', 'trees', 'queue', 'stack']
    },
    {
      id: 'recursion-iteration', title: 'Recursion vs Iteration', terms: [['recursion', 'recursive'], ['iteration', 'iterative', 'loop', 'loops']],
      body: `| | Recursion | Iteration |
|---|---|---|
| Mechanism | a function calls itself | a loop repeats a block |
| Stops when | the base case is reached | the loop condition becomes false |
| Memory | O(depth) call-stack frames | O(1) usually |
| Risk | stack overflow | infinite loop |
| Clearer for | trees, divide and conquer, backtracking | simple repetition, linear scans |`,
      verdict: 'Use recursion when the problem is naturally self-similar (trees, nested structures). Use loops for straightforward repetition or very deep inputs.',
      related: ['recursion', 'loops', 'dynamic-programming']
    },
    {
      id: 'sql-nosql', title: 'SQL vs NoSQL databases', terms: [['sql', 'relational', 'mysql', 'postgres', 'postgresql'], ['nosql', 'mongodb', 'mongo', 'non relational', 'document database']],
      body: `| | SQL (relational) | NoSQL |
|---|---|---|
| Structure | tables, rows, fixed schema | documents, key-value, graph, wide-column; flexible schema |
| Relationships | JOINs with foreign keys | embed data, or reference it manually |
| Transactions | strong ACID | varies (often eventual consistency) |
| Scaling | mostly vertical (bigger server) | designed to scale horizontally |
| Examples | MySQL, PostgreSQL, SQLite | MongoDB, Redis, Cassandra, Firebase |`,
      verdict: 'Start with SQL for structured data with relationships (most apps). Reach for NoSQL for flexible or huge-scale data, caching or real-time feeds.',
      related: ['sql-joins']
    },
    {
      id: 'get-post', title: 'GET vs POST', terms: [['get', 'get request'], ['post', 'post request']],
      body: `| | GET | POST |
|---|---|---|
| Purpose | **read** data | **send/create** data |
| Data goes in | the URL query string | the request body |
| Cached / bookmarkable | ✅ | ❌ |
| Safe and idempotent | ✅ | ❌ (repeating may create duplicates) |
| Size limit | URL length limits | large bodies are fine |
| Sensitive data | ❌ never (it ends up in logs and history) | ✅ (over HTTPS) |`,
      verdict: 'Use GET to fetch and POST to create or submit. For updates use PUT/PATCH, and DELETE to remove.',
      related: ['rest-api']
    },
    {
      id: 'merge-rebase', title: 'git merge vs git rebase', terms: [['merge', 'git merge'], ['rebase', 'git rebase']],
      body: `| | merge | rebase |
|---|---|---|
| History | keeps it as it happened, with a merge commit | rewrites your commits on top of the target: a linear history |
| Safe on shared branches | ✅ | ❌ don't rebase commits others already have |
| Conflicts | resolved once | may need resolving commit by commit |`,
      verdict: 'Beginners: use «merge», or «git pull --rebase» for your own unpushed work. Never rebase public history.',
      related: ['git']
    },
    {
      id: 'tcp-udp', title: 'TCP vs UDP', terms: [['tcp'], ['udp']],
      body: `| | TCP | UDP |
|---|---|---|
| Connection | connection-oriented (handshake) | connectionless |
| Reliability | guaranteed delivery and order, retransmits | best effort, may drop or reorder |
| Speed | slower (more overhead) | faster, lower latency |
| Used by | web (HTTP), email, file transfer | video calls, gaming, DNS, live streaming |`,
      verdict: 'Use TCP when every byte must arrive correctly. Use UDP when speed matters more than perfection.',
      related: ['rest-api']
    },
    {
      id: 'map-foreach', title: '«map()» vs «forEach()» in JavaScript', terms: [['map', 'map()', '.map'], ['foreach', 'forEach', 'for each', '.foreach']],
      body: `| | «map()» | «forEach()» |
|---|---|---|
| Returns | a **new array** of the results | «undefined» |
| Purpose | transform each element | run a side effect for each element |
| Chainable | ✅ «.map().filter()» | ❌ |`,
      code: { javascript: `const nums = [1, 2, 3];
const doubled = nums.map(n => n * 2);         // [2, 4, 6]
nums.forEach(n => console.log(n));            // just does something
const wrong = nums.forEach(n => n * 2);       // undefined!` },
      verdict: 'Use «map» when you want a new array, and «forEach» (or «for...of») when you just want to do something with each item.',
      related: ['arrays-lists', 'functions']
    },
    {
      id: 'append-extend', title: '«append()» vs «extend()» in Python', terms: [['append'], ['extend']],
      body: `| | «append(x)» | «extend(iterable)» |
|---|---|---|
| Adds | **one** element (even if it is a list) | **each** element of the iterable |
| «[1,2].append([3,4])» | «[1, 2, [3, 4]]» | — |
| «[1,2].extend([3,4])» | — | «[1, 2, 3, 4]» |`,
      verdict: 'Use «append» to add one item and «extend» (or «+=») to add many.',
      related: ['arrays-lists']
    },
    {
      id: 'struct-class', title: 'struct vs class (C++)', terms: [['struct', 'structure'], ['class']],
      body: `| | «struct» | «class» |
|---|---|---|
| Default member access | **public** | **private** |
| Default inheritance | public | private |
| Otherwise | identical: both can have methods, constructors and inheritance | |
| Convention | plain data bundles | objects with behaviour and invariants |

In **C**, a «struct» can only hold data (no methods or access control).`,
      verdict: 'In C++ the only real difference is the default visibility. Use «struct» for simple data and «class» for encapsulated objects.',
      related: ['classes-objects', 'encapsulation']
    },
    {
      id: 'stack-heap', title: 'Stack memory vs Heap memory', terms: [['stack memory', 'stack allocation'], ['heap memory', 'heap allocation', 'heap']],
      body: `| | Stack | Heap |
|---|---|---|
| Holds | local variables, function call frames | dynamically allocated objects |
| Allocation | automatic, very fast | manual («new»/«malloc») or by a GC, slower |
| Lifetime | ends when the function returns | until freed or garbage-collected |
| Size | small and fixed | large |
| Failure | stack overflow | out of memory, leaks, fragmentation |`,
      verdict: 'Prefer stack/automatic storage. Use the heap when data must outlive a function or is large or variable in size.',
      related: ['memory-management', 'pointers', 'recursion']
    },
    {
      id: 'break-continue', title: '«break» vs «continue»', terms: [['break'], ['continue']],
      body: `| | «break» | «continue» |
|---|---|---|
| Effect | **exits** the loop completely | **skips** to the next iteration |
| Code after it in the loop body | not run | not run (for this iteration only) |`,
      code: { python: `for n in range(1, 10):
    if n == 3:
        continue      # skip 3
    if n == 6:
        break         # stop at 6
    print(n)          # 1 2 4 5` },
      verdict: '«break» = "I\'m done with this loop". «continue» = "skip this one, carry on".',
      related: ['loops']
    },
    {
      id: 'for-while', title: 'for loop vs while loop', terms: [['for loop', 'for'], ['while loop', 'while']],
      body: `| | «for» | «while» |
|---|---|---|
| Best when | the number of iterations is known, or you iterate a collection | you repeat until a condition changes |
| Loop variable | managed by the loop | you must update it yourself |
| Typical bug | off-by-one | infinite loop (forgot to update) |
| Example | «for i in range(10)» | «while not done:» |`,
      verdict: 'Use «for» for counting and collections. Use «while» for "keep going until…".',
      related: ['loops']
    },
    {
      id: 'print-return', title: '«print» vs «return»', terms: [['print', 'printing', 'console.log', 'system.out.println'], ['return', 'returning']],
      body: `| | «print» | «return» |
|---|---|---|
| Who sees it | a **human**, on the screen | **your code**, the caller |
| Can the value be used later? | ❌ | ✅ |
| Ends the function? | ❌ | ✅ |
| A function with only print gives back | «None» / «undefined» | the returned value |`,
      code: { python: `def add_print(a, b):
    print(a + b)

def add_return(a, b):
    return a + b

x = add_print(2, 3)     # shows 5, but x is None
y = add_return(2, 3)    # shows nothing, y is 5
print(y * 10)           # 50` },
      verdict: 'Functions should usually **return** results and let the caller decide whether to print them.',
      related: ['functions']
    },
    {
      id: 'merge-quick', title: 'Merge sort vs Quick sort', terms: [['merge sort', 'mergesort'], ['quick sort', 'quicksort']],
      body: `| | Merge sort | Quick sort |
|---|---|---|
| Strategy | split in half, sort, **merge** | **partition** around a pivot, recurse |
| Worst case | O(n log n) ✅ | O(n²) (bad pivots) |
| Average | O(n log n) | O(n log n), usually faster in practice |
| Extra space | O(n) | O(log n) |
| Stable | ✅ | ❌ |
| Good for | linked lists, external sorting, when stability matters | in-memory arrays |`,
      verdict: 'Quick sort is usually faster on arrays. Merge sort gives a guaranteed O(n log n) and is stable.',
      related: ['sorting', 'big-o', 'recursion']
    },
    {
      id: 'python-java', title: 'Python vs Java vs C++ (which language to learn?)', terms: [['python'], ['java', 'c++', 'cpp']],
      body: `| | Python | Java | C++ |
|---|---|---|---|
| Typing | dynamic | static | static |
| Syntax | short, readable | verbose, structured | complex, powerful |
| Speed | slower | fast (JIT) | fastest |
| Memory | automatic (GC) | automatic (GC) | manual / RAII |
| Strong in | AI/ML, data, scripting, backends | enterprise, Android, backends | games, systems, competitive programming |
| Learning curve | easiest | moderate | steepest |`,
      verdict: 'For your first language, **Python** is the gentlest. Learn **Java** or **C++** next for DSA, placements and systems understanding. Concepts transfer between all three.',
      related: ['compilation', 'variables']
    },
    {
      id: 'frontend-backend', title: 'Frontend vs Backend', terms: [['frontend', 'front end', 'front-end', 'client side'], ['backend', 'back end', 'back-end', 'server side']],
      body: `| | Frontend | Backend |
|---|---|---|
| Runs on | the user's browser or device | a server |
| Responsible for | UI, layout, interactions | business logic, databases, auth, APIs |
| Languages and tools | HTML, CSS, JavaScript/TypeScript, React, Vue | Node.js, Python (Django/Flask), Java (Spring), Go, SQL |
| Talk via | HTTP requests to APIs | responses (usually JSON) |`,
      verdict: 'The frontend is what users see. The backend is what makes it work behind the scenes. Full-stack developers do both.',
      related: ['rest-api', 'dom']
    }
  ]);

  KB.add('faqs', [
    {
      id: 'faq-first-language', title: 'Which programming language should I learn first?',
      q: [/which (programming )?language (should|do) i (learn|start)/i, /best (programming )?language (to|for) (learn|start|beginners?)/i, /first programming language/i, /what language should i learn/i],
      answer: `There is no wrong answer, because concepts transfer. Here is a practical guide:

| Your goal | Start with |
|---|---|
| General learning, AI/ML, data, automation | **Python**: clean syntax, so you focus on logic |
| Websites and web apps | **JavaScript** (plus HTML and CSS) |
| College DSA and placements | **C++** or **Java**: widely used in interviews and competitive programming |
| Understanding how computers work | **C** |
| Android apps | **Kotlin** / Java |

**A solid path:** Python (3–6 weeks of fundamentals) → DSA in C++/Java/Python → a specialisation (web, ML, Android…).

> [!TIP]
> Consistency beats choice: 1 hour a day of real coding beats 7 hours of videos once a week.`,
      related: ['compare:python-java']
    },
    {
      id: 'faq-dsa-start', title: 'How do I start learning DSA?',
      q: [/how (do i|to|can i|should i) (start|learn|begin|prepare)[\w\s]*(dsa|data structures?|algorithms?|leetcode|competitive programming|coding interviews?|placements?)/i, /(dsa|data structures) roadmap/i],
      answer: `### A DSA roadmap that works
1. **One language, solid basics**: loops, functions, arrays, strings, recursion.
2. **Complexity**: [Big-O](ask:explain big o notation). Learn to estimate before you code.
3. **Core structures, in order**: arrays & strings → hashing → two pointers / sliding window → stack & queue → linked list → recursion & backtracking → binary search → trees & BST → heaps → graphs (BFS/DFS) → dynamic programming.
4. **Practice by pattern, not by random problem**: do 5–10 problems per pattern, easy to medium.
5. **Review**: re-solve problems you failed after 3 days without looking.

**How to attempt a problem**
- Understand it, then write 2–3 examples by hand, including edge cases.
- Brute force first, then ask "what is repeated work?" to optimise.
- State the time and space complexity.
- Code it, dry-run it, then test edge cases (empty input, one element, duplicates, negatives).

Ask me about any topic, for example ${KB.ask('Two pointers', 'explain two pointers and sliding window')} or ${KB.ask('Dynamic programming', 'explain dynamic programming')}.`,
      related: ['big-o', 'arrays-lists', 'recursion']
    },
    {
      id: 'faq-ask-good', title: 'How do I ask a good coding question?',
      q: [/how (do i|to|can i|should i) ask (a )?(good )?(coding |programming )?question/i, /how to use (this|codementor|you)/i, /what can you do/i, /how does this (app|work)/i, /\bhelp\b$/i, /^what (all )?can you (help|do)/i],
      answer: `I work best when you give me:

1. **The exact error message**: copy the *whole* thing, especially the last lines.
2. **Your code**, ideally in a code block (click the «{ }» button or paste it between three backticks).
3. **The language**, if it is not obvious.
4. **What you expected vs what happened.**

### Things you can ask me
- 🐞 **Fix errors**: "Why do I get «IndexError: list index out of range»?" plus your code
- 🧠 **Concepts**: "Explain recursion", "What is a closure?", "Explain Big-O simply"
- ⚖️ **Comparisons**: "Difference between «==» and «===»", "abstract class vs interface"
- 🛠️ **How-to**: "Write a program to check palindrome in Java"
- 🔍 **Code review**: paste code and ask "what's wrong?" or "explain this code line by line"
- ⏱️ **Complexity**: "What is the time complexity of this code?"
- 🎯 **Quizzes**: after a concept, say "quiz me"

Use the **Simple / Balanced / Deep** switch to control how detailed my answers are.`,
      related: ['debugging', 'stack-trace']
    },
    {
      id: 'faq-install-python', title: 'How do I install and run Python?',
      q: [/how (do i|to|can i) (install|setup|set up|download) python/i, /how (do i|to) run (a )?python (file|program|script|code)/i],
      answer: `### Windows
1. Download Python from **python.org** → Downloads.
2. ✅ **Tick "Add python.exe to PATH"** on the first installer screen. This is the step most people miss.
3. Open a **new** terminal and check:
~~~bash
python --version
# or the Windows launcher:
py --version
~~~

### Run a program
~~~bash
cd path\\to\\your\\folder
python hello.py
~~~

### Recommended editor
**VS Code** with the *Python* extension: open your folder, open the «.py» file and press ▶.

Seeing «'python' is not recognized…»? Ask me about that error and I'll walk you through fixing PATH.`,
      related: ['compilation']
    },
    {
      id: 'faq-run-c-java', title: 'How do I compile and run C, C++ or Java?',
      q: [/how (do i|to|can i) (compile|run|execute) (a |my )?(c|c\+\+|cpp|java) (program|code|file)/i, /how to run (c|c\+\+|cpp|java)\b/i, /install (gcc|mingw|jdk|g\+\+)/i],
      answer: `### C / C++
Install a compiler: **MinGW-w64** or **MSYS2** on Windows (adds «gcc»/«g++»), Xcode Command Line Tools on macOS, «build-essential» on Linux.
~~~bash
gcc main.c -o main        # C
g++ main.cpp -o main      # C++
./main                    # Windows: main.exe
~~~
Add «-Wall -g» to see helpful warnings and enable debugging.

### Java
Install a **JDK** (e.g. Temurin or Oracle JDK 17/21). A JRE alone has no «javac».
~~~bash
javac Main.java           # compile → Main.class
java Main                 # run (no .class extension)
java Main.java            # Java 11+: compile + run in one step
~~~

> [!TIP]
> In CodeMentor's **Playground**, code runs on your machine using whichever of these compilers you have installed.`,
      related: ['compilation']
    },
    {
      id: 'faq-practice', title: 'How should I practice coding?',
      q: [/how (do i|to|can i|should i) (practice|get better at|improve( my)?) (coding|programming)/i, /how to improve (coding|programming|logic|problem solving)/i, /how to build (logic|logical thinking)/i, /i am (weak|bad) (at|in) (coding|logic|programming)/i],
      answer: `### Building programming logic
1. **Solve before you code**: write the steps in plain words, then translate them.
2. **Trace by hand**: draw variables and update them line by line. This builds a mental model of execution.
3. **Small daily problems**: patterns, digit problems, string manipulation, arrays. Consistency beats intensity.
4. **Read others' solutions *after* trying**: note the trick and re-solve it the next day from memory.
5. **Build tiny projects**: a calculator, a to-do list, a quiz game or an expense tracker. Projects connect concepts.
6. **Debug deliberately**: when something breaks, understand *why* before fixing it. Paste the error here and I'll explain it.

> [!TIP] The 20-minute rule
> Stuck for 20 minutes? Look at a hint, not the full solution, then keep going.`,
      related: ['debugging']
    },
    {
      id: 'faq-what-ide', title: 'What is an IDE / which editor should I use?',
      q: [/what is (an )?ide\b/i, /which (ide|editor|code editor) (should|to)/i, /best (ide|editor) for/i],
      answer: `An **IDE** (Integrated Development Environment) bundles an editor, a runner, a debugger and helpful tools in one place.

| Editor / IDE | Great for |
|---|---|
| **VS Code** (free) | everything: Python, JS, C/C++, Java with extensions |
| **PyCharm Community** | Python |
| **IntelliJ IDEA Community** | Java, Kotlin |
| **Code::Blocks / CLion** | C/C++ |
| **CodeMentor Playground** | quick experiments, offline |

Start with **VS Code** plus the extension for your language, and learn three shortcuts: run, format document and go to definition.`,
      related: ['debugging']
    },
    {
      id: 'faq-offline', title: 'Does CodeMentor work offline? Where is my data?',
      q: [/(does|do) (this|codementor|it|you) work offline/i, /where is my data/i, /is my data (safe|private|stored)/i, /are you (online|connected)/i, /privacy/i],
      answer: `Yes. CodeMentor is **100% offline**:
- 🧠 Answers come from a built-in knowledge engine (concepts, 70+ error patterns, recipes, a code analyzer) that runs inside your browser.
- 💾 Your account, profile, chats and snippets are stored **only on this device** (IndexedDB), and your password is hashed with PBKDF2.
- 🔐 Sessions are bound to this device's fingerprint, and you can review trusted devices under **Profile → Security**.
- ▶️ Code runs locally: JavaScript in a sandboxed worker, and Python/Java/C/C++ through compilers installed on your machine (when started with the launcher).
- 🤖 Optional: connect a **local** AI model (Ollama or LM Studio) in Settings for open-ended questions. It is still offline.

You can export or delete all your data from **Settings → Data**.`,
      related: []
    },
    {
      id: 'faq-project-ideas', title: 'Project ideas for students',
      q: [/project ideas?/i, /what (project|projects) (should|can) i (build|make|do)/i, /mini project/i],
      answer: `| Level | Project ideas | Concepts practised |
|---|---|---|
| Beginner | calculator, number-guessing game, to-do list (CLI), unit converter, quiz app | input, conditions, loops, functions |
| Intermediate | expense tracker with file saving, library management (OOP), weather app (API), tic-tac-toe with AI, notes app | OOP, file I/O, APIs, data structures |
| Advanced | chat app (sockets), URL shortener (DB + API), mini search engine, pathfinding visualiser, personal finance dashboard | databases, networking, algorithms, UI |

> [!TIP]
> Pick something **you** would use. Finish a small version first, then add features. Put it on GitHub with a README.`,
      related: ['git']
    },
    {
      id: 'faq-thanks', title: 'Thanks', q: [/^(thanks?|thank you|thx|ty|tysm|thanks a lot|great|awesome|nice|cool|ok(ay)?|got it|understood|perfect)[\s!.]*$/i],
      answer: `Happy to help! 🙌 Want to go further? Try asking me to **quiz you** on this topic, or paste another error or code snippet.`,
      related: []
    },
    {
      id: 'faq-greet', title: 'Hello', q: [/^(hi+|hello+|hey+|yo|hola|namaste|good (morning|afternoon|evening)|sup|hii+)[\s!.,]*(there|codementor|mentor)?[\s!.]*$/i],
      answer: `Hey there! 👋 I'm **CodeMentor**, your offline coding mentor.

I can:
- 🐞 **Decode errors**: paste the error message and your code
- 🧠 **Explain concepts** simply, from recursion to closures to Big-O
- 🔍 **Review your code** and walk through it line by line
- 🛠️ **Write programs** in Python, JavaScript, Java, C++ or C

What are you working on?`,
      related: []
    },
    {
      id: 'faq-who', title: 'Who are you?', q: [/^(who|what) are you\??$/i, /are you (an? )?(ai|bot|chatgpt|human|robot)/i, /what is codementor/i],
      answer: `I'm **CodeMentor**, a coding mentor that runs entirely on your device. I don't use the internet. I answer from a built-in knowledge engine designed for students: error decoding, concept explanations, code reviews and code recipes.

For open-ended questions beyond my knowledge base, you can connect a local AI model (Ollama or LM Studio) in **Settings → AI Engine**, and everything still stays offline.`,
      related: []
    }
  ]);
})();
