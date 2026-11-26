/* CodeMentor KB — language-specific concepts, tools & web */
(function () {
  'use strict';
  window.CM.kb.add('concepts', [
    {
      id: 'pointers', title: 'Pointers & References (C/C++)', cat: 'C / C++', level: 'Intermediate',
      aliases: ['pointer', 'pointers', 'memory address', 'address of', 'dereference', 'dereferencing', 'null pointer', 'pointer arithmetic', 'references c++', 'reference variable', 'double pointer', 'pointer to pointer', 'nullptr', 'ampersand', 'asterisk'],
      summary: 'A pointer is a variable that stores the memory address of another variable.',
      analogy: 'A pointer is like a house address written on a piece of paper. It is not the house itself, but it tells you exactly where to find the house and lets you go in and change things.',
      explain: `~~~text
int x = 42;          int *p = &x;

 x                     p
┌──────┐             ┌──────────┐
│  42  │ ◄───────────│ 0x7ffe10 │
└──────┘             └──────────┘
address 0x7ffe10
~~~
| Symbol | In a declaration | In an expression |
|---|---|---|
| «*» | «int *p» → p is a pointer to int | «*p» → **dereference**: the value at that address |
| «&» | «int &r = x» (C++ reference) | «&x» → **address of** x |

**Why pointers?**
- To let a function **modify** the caller's variable (swap, scanf).
- To work with **dynamic memory** («malloc» / «new»).
- To pass large structures cheaply (pass the address, not a copy).
- Arrays are closely tied to pointers: «arr[i]» is the same as «*(arr + i)».`,
      deep: `### Pointer arithmetic
«p + 1» moves by «sizeof(*p)» bytes, not by 1 byte. For an «int*» on most systems that is 4 bytes.

### C++ references
A reference is an *alias* for an existing variable: «int &r = x;». It can't be null and can't be re-pointed, which makes it safer than a pointer for parameters.

### Dangerous situations
- **NULL / uninitialised pointer** dereference → segmentation fault.
- **Dangling pointer**: pointing to memory that has been freed, or to a local variable of a function that already returned.
- **Wild pointer**: declared but never initialised; it points at random memory.`,
      code: {
        c: `#include <stdio.h>

void swap(int *a, int *b) {      // receives addresses
    int t = *a;
    *a = *b;
    *b = t;
}

int main() {
    int x = 5, y = 9;
    int *p = &x;
    printf("x=%d, *p=%d, p=%p\\n", x, *p, (void*)p);
    *p = 50;                     // changes x through the pointer
    swap(&x, &y);                // pass addresses so swap can modify
    printf("x=%d y=%d\\n", x, y); // x=9 y=50

    int arr[3] = {10, 20, 30};
    printf("%d\\n", *(arr + 2)); // 30, same as arr[2]
    return 0;
}`,
        cpp: `#include <iostream>
using namespace std;

void addOne(int &n) { n++; }          // reference parameter
void addOnePtr(int *n) { (*n)++; }    // pointer parameter

int main() {
    int a = 1;
    addOne(a);
    addOnePtr(&a);
    cout << a << endl;                // 3
    int *p = nullptr;                 // always initialise pointers
    if (p != nullptr) cout << *p;     // guard before dereferencing
}`
      },
      mistakes: ['Dereferencing a NULL or uninitialised pointer causes a segmentation fault.', '«scanf("%d", x)» instead of «scanf("%d", &x)».', 'Returning the address of a local variable from a function.', 'Confusing «*» in a declaration with «*» for dereferencing.', 'Using a pointer after calling «free()» on it.'],
      quiz: [
        { q: 'If «int x = 7; int *p = &x;», what is «*p»?', o: ['The address of x', '7', 'The address of p', 'Undefined'], a: 1, why: '*p dereferences p, giving the value stored at x.' }
      ],
      related: ['memory-management', 'arrays-lists', 'linked-list']
    },
    {
      id: 'memory-management', title: 'Memory: Stack, Heap & Garbage Collection', cat: 'C / C++', level: 'Intermediate',
      aliases: ['memory', 'memory management', 'stack memory', 'heap memory', 'stack vs heap', 'malloc', 'calloc', 'free', 'new delete', 'garbage collection', 'garbage collector', 'memory leak', 'memory leaks', 'dynamic memory allocation', 'dangling pointer', 'smart pointer', 'unique_ptr', 'raii'],
      summary: 'Programs use automatic stack memory for local variables and heap memory for dynamic data. The heap is managed by hand in C/C++ or by a garbage collector in Java, Python and JS.',
      explain: `| | Stack | Heap |
|---|---|---|
| Holds | local variables, function frames | objects created at runtime |
| Managed by | automatic (push/pop with calls) | you («malloc/free», «new/delete») or a GC |
| Speed | very fast | slower |
| Size | small (often 1–8 MB) | large |
| Lifetime | until the function returns | until freed or collected |
| Too much | **stack overflow** | out of memory, leaks |

### C / C++: manual management
- C: «malloc» / «calloc» to get memory and «free» to give it back.
- C++: «new» / «delete», or better, **smart pointers** («unique_ptr», «shared_ptr») that free memory automatically (RAII).

### Java, Python, JS: garbage collection
The runtime frees objects automatically once **nothing references them anymore**. You can still "leak" memory by keeping references you don't need, such as ever-growing lists or caches.`,
      code: {
        c: `#include <stdio.h>
#include <stdlib.h>

int main() {
    int n = 5;
    int *arr = malloc(n * sizeof(int));     // heap allocation
    if (arr == NULL) { printf("out of memory\\n"); return 1; }
    for (int i = 0; i < n; i++) arr[i] = i * i;
    printf("%d\\n", arr[4]);                 // 16
    free(arr);                              // give it back
    arr = NULL;                             // avoid a dangling pointer
    return 0;
}`,
        cpp: `#include <iostream>
#include <memory>
#include <vector>
using namespace std;

int main() {
    int* raw = new int(42);       // manual
    delete raw;                   // must not forget!

    auto smart = make_unique<int>(42);   // freed automatically
    vector<int> v(1000000, 0);           // vector manages its own heap memory
    cout << *smart << " " << v.size() << endl;
}`
      },
      mistakes: ['Forgetting «free» / «delete», which leaks memory.', 'Freeing the same pointer twice (double free).', 'Using memory after freeing it (use-after-free).', 'Mismatching «new[]» with «delete» (use «delete[]»).', 'Huge local arrays such as «int a[10000000]» overflow the stack. Allocate them on the heap.'],
      related: ['pointers', 'recursion', 'compilation']
    },
    {
      id: 'js-async', title: 'Async JavaScript: Callbacks, Promises & async/await', cat: 'JavaScript', level: 'Intermediate',
      aliases: ['async', 'await', 'async await', 'async/await', 'promise', 'promises', 'callback', 'callbacks', 'callback hell', 'event loop', 'asynchronous', 'asynchronous javascript', 'then catch', '.then', 'fetch', 'settimeout', 'microtask', 'promise.all', 'non-blocking', 'promise pending'],
      summary: 'JavaScript runs on one thread but handles slow tasks (network, timers, files) asynchronously so nothing freezes. Promises and async/await manage results that arrive later.',
      analogy: 'Ordering at a food court: you get a buzzer (a Promise) and go sit with friends. When the food is ready the buzzer goes off (resolve) and you collect it (then/await). If the kitchen runs out, the buzzer flashes red (reject).',
      explain: `### Synchronous vs asynchronous
Synchronous code runs line by line, and each line waits for the previous one. Async operations start now and **finish later**, while the rest of your code keeps running.

### The evolution
~~~javascript
// 1. Callbacks (can nest into "callback hell")
getUser(id, (user) => { getPosts(user, (posts) => { ... }); });

// 2. Promises
getUser(id).then(user => getPosts(user)).then(posts => ...).catch(err => ...);

// 3. async/await (reads like normal code)
async function show(id) {
  try {
    const user = await getUser(id);
    const posts = await getPosts(user);
  } catch (err) { console.error(err); }
}
~~~

A **Promise** is always in one of 3 states: **pending**, **fulfilled** (it has a value) or **rejected** (it has an error).

> [!WARNING] await only pauses the async function it is in
> Code outside that function keeps running. If you see «Promise { <pending> }», you forgot to «await» (or «.then»).`,
      deep: `### The event loop in one picture
1. Run all synchronous code (the **call stack**).
2. Run all queued **microtasks** (promise callbacks, «await» continuations).
3. Run one **macrotask** (a «setTimeout» callback, a UI event), then go back to step 2.

~~~javascript
console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));
console.log("D");
// Output: A D C B
~~~

### Running things in parallel
~~~javascript
const [user, settings] = await Promise.all([getUser(), getSettings()]);  // both at once
~~~
Awaiting them one after another would take the *sum* of both times instead of the *max*.`,
      code: {
        javascript: `// Make a promise yourself
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function loadUser() {
  try {
    await wait(500);                               // pretend network delay
    const res = await fetch("https://jsonplaceholder.typicode.com/users/1");
    if (!res.ok) throw new Error("HTTP " + res.status);
    const user = await res.json();
    console.log(user.name);
  } catch (err) {
    console.error("Failed:", err.message);
  }
}
loadUser();
console.log("This prints first!");`,
        python: `import asyncio

async def fetch_data(name, delay):
    await asyncio.sleep(delay)        # non-blocking wait
    return f"{name} done"

async def main():
    results = await asyncio.gather(   # run concurrently
        fetch_data("A", 1), fetch_data("B", 1))
    print(results)                    # finishes in ~1s, not 2s

asyncio.run(main())`
      },
      mistakes: ['Forgetting «await», so you get «Promise { <pending> }» instead of the value.', 'Using «await» inside «forEach», which doesn\'t wait. Use «for...of» or «Promise.all(arr.map(...))».', 'Not handling rejections (no «.catch» or try/catch), which gives "Unhandled promise rejection".', 'Using «await» in a function that isn\'t marked «async».', 'Expecting code after an async call to run after it finishes.'],
      quiz: [
        { q: 'What does this print? «console.log(1); setTimeout(()=>console.log(2)); Promise.resolve().then(()=>console.log(3)); console.log(4);»', o: ['1 2 3 4', '1 4 3 2', '1 4 2 3', '1 3 4 2'], a: 1, why: 'Sync code runs first (1, 4), then microtasks (3), then timers (2).' }
      ],
      related: ['js-closures', 'rest-api', 'functions']
    },
    {
      id: 'js-closures', title: 'Closures', cat: 'JavaScript', level: 'Intermediate',
      aliases: ['closure', 'closures', 'lexical environment', 'function factory', 'private variables in javascript', 'counter closure', 'closure in loop', 'python closure', 'nested function'],
      summary: 'A closure is a function that remembers the variables from the place where it was created, even after that outer function has finished running.',
      analogy: 'A backpack: when a function is created, it packs the variables around it into a backpack and carries them wherever it goes.',
      explain: `~~~javascript
function makeCounter() {
  let count = 0;                 // lives inside makeCounter
  return function () {           // this inner function "closes over" count
    count++;
    return count;
  };
}
const next = makeCounter();
next(); // 1
next(); // 2   ← count survived even though makeCounter finished!
~~~

**Why it matters**
- **Private state**: «count» can't be reached from outside.
- **Function factories**: «makeMultiplier(3)» returns a function that triples its input.
- **Callbacks and event handlers** remember the data they need.

### The classic loop bug
~~~javascript bad
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i));   // 3 3 3
~~~
~~~javascript good
for (let i = 0; i < 3; i++) setTimeout(() => console.log(i));   // 0 1 2
~~~
«var» has one shared «i» for the whole loop, while «let» creates a fresh «i» for every iteration.`,
      code: {
        javascript: `function makeMultiplier(factor) {
  return (x) => x * factor;      // remembers 'factor'
}
const double = makeMultiplier(2);
const triple = makeMultiplier(3);
console.log(double(5), triple(5)); // 10 15

function bankAccount() {
  let balance = 0;               // private!
  return {
    deposit: (x) => (balance += x),
    get: () => balance,
  };
}
const acc = bankAccount();
acc.deposit(100);
console.log(acc.get(), acc.balance); // 100 undefined`,
        python: `def make_counter():
    count = 0
    def counter():
        nonlocal count      # needed to modify the enclosing variable
        count += 1
        return count
    return counter

c = make_counter()
print(c(), c(), c())        # 1 2 3`
      },
      mistakes: ['Using «var» in loops with async callbacks.', 'Python: modifying the enclosed variable without «nonlocal».', 'Accidentally keeping large objects alive through closures (memory).'],
      related: ['scope', 'functions', 'js-hoisting', 'js-this']
    },
    {
      id: 'js-this', title: 'The «this» Keyword in JavaScript', cat: 'JavaScript', level: 'Intermediate',
      aliases: ['this keyword', 'this in javascript', 'javascript this', 'bind', 'call apply bind', 'arrow function this', 'lost this', 'this is undefined', 'context'],
      summary: 'In JavaScript, «this» refers to the object that is calling the function. It is decided when the function is called, not where it is written. Arrow functions are the exception.',
      explain: `| How the function is called | «this» is… |
|---|---|
| «obj.method()» | «obj» |
| plain call «fn()» | «undefined» (strict mode/modules) or the global object |
| «new Fn()» | the brand-new object |
| «fn.call(x)», «fn.apply(x)», «fn.bind(x)» | «x» |
| **arrow function** | inherited from the surrounding code (lexical) |
| DOM event handler «function» | the element that fired the event |

### The "lost this" bug
~~~javascript bad
const user = {
  name: "Asha",
  greet() { console.log("Hi " + this.name); }
};
setTimeout(user.greet, 100);   // "Hi undefined": called as a plain function
~~~
~~~javascript good
setTimeout(() => user.greet(), 100);   // called as user.greet()
setTimeout(user.greet.bind(user), 100); // or bind it
~~~`,
      code: {
        javascript: `class Timer {
  constructor() { this.seconds = 0; }
  start() {
    // Arrow function keeps 'this' = the Timer instance
    setInterval(() => { this.seconds++; }, 1000);
  }
}

const obj = {
  value: 42,
  regular() { return this.value; },       // 42 when called as obj.regular()
  arrow: () => typeof this,               // arrow: 'this' from outer scope, not obj
};
console.log(obj.regular(), obj.arrow());`
      },
      mistakes: ['Passing «obj.method» as a callback, which loses «this».', 'Using arrow functions as object methods when you need «this».', 'Forgetting «new» with a constructor function.'],
      related: ['js-closures', 'classes-objects', 'js-hoisting']
    },
    {
      id: 'js-hoisting', title: 'Hoisting and var / let / const', cat: 'JavaScript', level: 'Beginner',
      aliases: ['hoisting', 'var let const', 'let vs var', 'var vs let', 'const', 'temporal dead zone', 'tdz', 'block scope javascript', 'var hoisting', 'function hoisting', 'difference between var let and const'],
      summary: 'Hoisting means declarations are processed before the code runs. «var» and function declarations can be used "early", while «let»/«const» exist but can\'t be touched until their line runs (the temporal dead zone).',
      explain: `| | «var» | «let» | «const» |
|---|---|---|---|
| Scope | function | block «{ }» | block «{ }» |
| Hoisted? | yes, initialised to «undefined» | yes, but in the TDZ | yes, but in the TDZ |
| Re-declare in same scope | ✅ | ❌ | ❌ |
| Re-assign | ✅ | ✅ | ❌ |
| Use today? | avoid | when the value changes | **default choice** |

~~~javascript
console.log(a);   // undefined   (var is hoisted)
var a = 1;

console.log(b);   // ReferenceError: Cannot access 'b' before initialization
let b = 2;

sayHi();          // works: function declarations are fully hoisted
function sayHi() { console.log("hi"); }
~~~

> [!NOTE] const is not "immutable"
> «const arr = [1]; arr.push(2);» is fine. «const» stops **reassignment** of the variable, not changes inside the object.`,
      code: {
        javascript: `const PI = 3.14159;        // never reassigned → const
let score = 0;             // changes → let
score += 10;

const user = { name: "Asha" };
user.name = "Ravi";        // OK: mutating the object
// user = {};              // TypeError: Assignment to constant variable.

if (true) {
  let inner = "block only";
  var leaky = "function-wide";
}
console.log(typeof inner, leaky);   // "undefined" "function-wide"`
      },
      mistakes: ['Using a «let»/«const» variable before its declaration line.', 'Reassigning a «const».', 'Using «var» and having variables leak out of blocks.'],
      related: ['scope', 'js-closures', 'variables']
    },
    {
      id: 'python-comprehensions', title: 'List & Dict Comprehensions', cat: 'Python', level: 'Beginner',
      aliases: ['list comprehension', 'list comprehensions', 'dict comprehension', 'dictionary comprehension', 'set comprehension', 'generator expression', 'comprehension', 'one line for loop python', 'python one liner'],
      summary: 'A compact way to build a list, dict or set from another iterable in one readable expression.',
      explain: `~~~text
[ expression   for item in iterable   if condition ]
   what to keep   loop                  optional filter
~~~
~~~python
squares = []
for x in range(10):
    if x % 2 == 0:
        squares.append(x * x)

squares = [x * x for x in range(10) if x % 2 == 0]   # same thing in one line
~~~

| Kind | Syntax | Result |
|---|---|---|
| List | «[x*2 for x in nums]» | list |
| Set | «{x % 3 for x in nums}» | set (unique) |
| Dict | «{name: len(name) for name in names}» | dict |
| Generator | «(x*x for x in nums)» | lazy iterator (saves memory) |

> [!TIP] Readability first
> If a comprehension needs nested loops plus several conditions, a normal for loop is usually clearer.`,
      code: {
        python: `nums = [3, 8, 1, 6, 5]
evens   = [n for n in nums if n % 2 == 0]          # [8, 6]
labels  = ["even" if n % 2 == 0 else "odd" for n in nums]
lengths = {w: len(w) for w in ["hi", "hello"]}    # {'hi': 2, 'hello': 5}
matrix  = [[r * c for c in range(3)] for r in range(3)]
flat    = [x for row in matrix for x in row]
total   = sum(n * n for n in nums)                # generator, no list built
print(evens, labels, lengths, flat, total)`,
        javascript: `// JavaScript equivalent: map / filter
const nums = [3, 8, 1, 6, 5];
const evens = nums.filter(n => n % 2 === 0);
const squares = nums.map(n => n * n);
const lengths = Object.fromEntries(["hi", "hello"].map(w => [w, w.length]));
console.log(evens, squares, lengths);`
      },
      mistakes: ['Putting «if/else» in the wrong place. A filter goes at the end; a conditional expression goes at the front.', 'Writing comprehensions only for their side effects (like printing). Use a loop.', 'Building a huge list when a generator would do.'],
      related: ['loops', 'arrays-lists', 'python-mutability']
    },
    {
      id: 'python-mutability', title: 'Mutable vs Immutable & References', cat: 'Python', level: 'Intermediate',
      aliases: ['mutable', 'immutable', 'mutability', 'immutability', 'aliasing', 'reference', 'references', 'shallow copy', 'deep copy', 'copy list', 'copy a list', 'mutable default argument', 'identity', 'list changes unexpectedly', 'mutable vs immutable'],
      summary: 'Mutable objects (lists, dicts, sets) can change in place, while immutable ones (int, str, tuple) can\'t. Variables hold references, so two names can point to the same mutable object.',
      analogy: 'Two friends sharing a Google Doc link: if one edits the doc, the other sees the change, because it is the same document. A PDF copy is independent.',
      explain: `| Immutable | Mutable |
|---|---|
| «int», «float», «str», «tuple», «bool», «frozenset» | «list», «dict», «set», most custom objects |
| "changing" creates a new object | changes the object itself |

~~~python
a = [1, 2, 3]
b = a            # b and a point to the SAME list
b.append(4)
print(a)         # [1, 2, 3, 4]
print(a is b)    # True, same identity
~~~

### Making real copies
- Shallow copy: «b = a.copy()», «list(a)», «a[:]». A new outer list, but the same inner objects.
- Deep copy: «import copy; b = copy.deepcopy(a)». Fully independent, including nested lists.

> [!WARNING] The mutable default argument trap
> «def add(item, bucket=[])» creates **one** list when the function is defined, and every call shares it. Use «bucket=None» and then «if bucket is None: bucket = []».`,
      code: {
        python: `import copy

grid = [[0] * 3] * 3       # 3 references to the SAME row!
grid[0][0] = 1
print(grid)                # [[1,0,0],[1,0,0],[1,0,0]]

grid = [[0] * 3 for _ in range(3)]   # 3 separate rows
grid[0][0] = 1
print(grid)                # [[1,0,0],[0,0,0],[0,0,0]]

def add(item, bucket=None):
    if bucket is None:
        bucket = []
    bucket.append(item)
    return bucket

nested = [[1, 2], [3]]
deep = copy.deepcopy(nested)
deep[0].append(99)
print(nested, deep)`
      },
      mistakes: ['«[[0]*n]*m» creates rows that are all the same list.', 'Mutable default arguments.', 'Expecting «b = a» to copy a list.', 'Using «is» to compare values. Use «==»; «is» checks identity.'],
      quiz: [
        { q: 'After «a = [1]; b = a; b.append(2)», what is «a»?', o: ['[1]', '[1, 2]', '[2]', 'Error'], a: 1, why: 'a and b refer to the same list object.' }
      ],
      related: ['variables', 'functions', 'arrays-lists', 'strings']
    },
    {
      id: 'git', title: 'Git & GitHub Basics', cat: 'Tools & Web', level: 'Beginner',
      aliases: ['git', 'github', 'version control', 'commit', 'git commit', 'push', 'git push', 'pull', 'git pull', 'branch', 'branches', 'merge', 'clone', 'repository', 'repo', 'staging area', 'git add', 'pull request', 'gitignore', 'git basics', 'how to use git'],
      summary: 'Git is a version control system that saves snapshots (commits) of your code, so you can go back in time, work on branches and collaborate. GitHub hosts Git repositories online.',
      analogy: 'A save-game system for your code: every commit is a save point you can return to, and branches are parallel playthroughs you can merge later.',
      explain: `~~~text
working folder ──git add──► staging area ──git commit──► local repo ──git push──► GitHub
              ◄────────────────────── git pull ◄──────────────────────────────────
~~~

| Command | What it does |
|---|---|
| «git init» | start tracking the current folder |
| «git clone <url>» | download a repository |
| «git status» | see what changed (**run it often!**) |
| «git add <file>» / «git add .» | stage changes for the next commit |
| «git commit -m "message"» | save a snapshot |
| «git log --oneline» | list the history |
| «git branch feature» / «git switch feature» | create / move to a branch |
| «git merge feature» | bring a branch's commits into the current branch |
| «git pull» | fetch and merge from the remote |
| «git push» | upload your commits |

**.gitignore** lists files Git should ignore: «node_modules/», «__pycache__/», «.env», build outputs.`,
      code: {
        bash: `git config --global user.name "Your Name"
git config --global user.email "you@example.com"

git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/you/project.git
git push -u origin main

git switch -c fix-login      # new branch
# ...edit files...
git add . && git commit -m "Fix login validation"
git switch main && git merge fix-login`
      },
      mistakes: ['Committing secrets («.env», API keys). Add them to «.gitignore» first.', 'Committing «node_modules» or build folders.', 'Vague commit messages like "changes".', 'Working directly on «main» for big changes. Use branches.'],
      related: ['debugging']
    },
    {
      id: 'sql-joins', title: 'SQL Basics & Joins', cat: 'Databases', level: 'Beginner',
      aliases: ['sql', 'join', 'joins', 'sql join', 'sql joins', 'inner join', 'left join', 'right join', 'full join', 'outer join', 'primary key', 'foreign key', 'select query', 'group by', 'having', 'sql query', 'database', 'relational database', 'where clause', 'aggregate functions'],
      summary: 'SQL is the language for querying relational databases. JOINs combine rows from two tables using a related column, usually a foreign key.',
      explain: `**students**
| id | name |
|---|---|
| 1 | Asha |
| 2 | Ravi |
| 3 | Kiran |

**enrollments**
| student_id | course |
|---|---|
| 1 | DSA |
| 1 | DBMS |
| 2 | DSA |

| Join | Returns |
|---|---|
| **INNER JOIN** | only rows that match in both tables (Asha ×2, Ravi) |
| **LEFT JOIN** | every student, plus the course if there is one (Kiran gets NULL) |
| **RIGHT JOIN** | every enrollment, plus the student if there is one |
| **FULL OUTER JOIN** | everything from both sides |

- **Primary key**: a unique id for each row («students.id»).
- **Foreign key**: a column that points to another table's primary key («enrollments.student_id»).

**Query order to remember:** «SELECT … FROM … JOIN … WHERE … GROUP BY … HAVING … ORDER BY … LIMIT»`,
      code: {
        sql: `-- All students with their courses (students without courses too)
SELECT s.name, e.course
FROM students s
LEFT JOIN enrollments e ON e.student_id = s.id;

-- How many courses per student, only those with 2+
SELECT s.name, COUNT(e.course) AS courses
FROM students s
JOIN enrollments e ON e.student_id = s.id
GROUP BY s.name
HAVING COUNT(e.course) >= 2
ORDER BY courses DESC;

-- Students NOT enrolled anywhere
SELECT s.name
FROM students s
LEFT JOIN enrollments e ON e.student_id = s.id
WHERE e.student_id IS NULL;`
      },
      mistakes: ['Forgetting the «ON» condition, which produces a cartesian product (every row × every row).', 'Using «WHERE» to filter aggregates. Use «HAVING».', 'Selecting columns that are not in GROUP BY or inside an aggregate.', '«= NULL» never matches. Use «IS NULL».', 'Ambiguous column names when both tables have «id». Prefix them with the table alias.'],
      related: ['rest-api']
    },
    {
      id: 'rest-api', title: 'APIs, HTTP & REST', cat: 'Tools & Web', level: 'Beginner',
      aliases: ['api', 'apis', 'rest', 'rest api', 'restful', 'http', 'http methods', 'get post put delete', 'endpoint', 'endpoints', 'json api', 'status codes', 'http status codes', 'request response', 'what is an api', 'fetch api', 'crud'],
      summary: 'An API lets programs talk to each other. A REST API uses HTTP methods on URLs (endpoints) to create, read, update and delete data, usually exchanged as JSON.',
      analogy: 'A restaurant waiter: you (the client) don\'t walk into the kitchen (the server/database). You give your order to the waiter (the API), who brings back your food (the response).',
      explain: `| HTTP method | CRUD | Example |
|---|---|---|
| **GET** | Read | «GET /students/7» |
| **POST** | Create | «POST /students» with a JSON body |
| **PUT / PATCH** | Update (replace / partial) | «PATCH /students/7» |
| **DELETE** | Delete | «DELETE /students/7» |

| Status | Meaning |
|---|---|
| **200** OK, **201** Created, **204** No Content | success |
| **400** Bad Request | your data is invalid |
| **401** Unauthorized / **403** Forbidden | not logged in / not allowed |
| **404** Not Found | wrong URL or id |
| **500** Internal Server Error | bug on the server |

A request has a **method**, a **URL**, **headers** (such as «Content-Type: application/json» or auth tokens) and an optional **body**.`,
      code: {
        javascript: `// GET
const res = await fetch("https://api.example.com/students/7");
if (!res.ok) throw new Error("HTTP " + res.status);
const student = await res.json();

// POST
await fetch("https://api.example.com/students", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Asha", year: 2 }),
});`,
        python: `import requests   # pip install requests

r = requests.get("https://api.example.com/students/7", timeout=10)
r.raise_for_status()
print(r.json())

r = requests.post("https://api.example.com/students", json={"name": "Asha"})
print(r.status_code)   # 201`,
        bash: `curl https://api.example.com/students/7
curl -X POST -H "Content-Type: application/json" -d '{"name":"Asha"}' https://api.example.com/students`
      },
      mistakes: ['Not checking «res.ok» or the status code, since fetch only rejects on network failure.', 'Forgetting «JSON.stringify» for the body, or the «Content-Type» header.', 'Calling «res.json()» on an HTML error page ("Unexpected token <").', 'Putting secret API keys in frontend code.'],
      related: ['js-async', 'sql-joins', 'dom']
    },
    {
      id: 'dom', title: 'The DOM & Events (JavaScript in the Browser)', cat: 'Tools & Web', level: 'Beginner',
      aliases: ['dom', 'document object model', 'queryselector', 'getelementbyid', 'addeventlistener', 'event listener', 'event listeners', 'manipulate html', 'innerhtml', 'textcontent', 'javascript html', 'events', 'click event', 'dom manipulation'],
      summary: 'The DOM is the browser\'s live tree of your HTML page. JavaScript can read and change it to make pages interactive.',
      explain: `~~~text
document
 └── html
      ├── head
      └── body
           ├── h1  "Counter"
           └── button#btn  "Click me"
~~~
| Task | Code |
|---|---|
| Find one element | «document.querySelector("#btn")» or «getElementById("btn")» |
| Find many | «document.querySelectorAll(".item")» |
| Change text | «el.textContent = "Hi"» |
| Change style/class | «el.classList.add("active")» |
| React to clicks | «el.addEventListener("click", handler)» |
| Create elements | «document.createElement("li")» and «parent.append(li)» |

> [!WARNING] "Cannot read properties of null"
> This usually means your script ran **before** the HTML element existed. Put «<script>» at the end of «<body>», or use «<script defer src="app.js">».`,
      code: {
        html: `<!DOCTYPE html>
<html>
<body>
  <h1 id="count">0</h1>
  <button id="btn">Click me</button>
  <ul id="list"></ul>

  <script>
    const countEl = document.getElementById("count");
    const list = document.querySelector("#list");
    let count = 0;

    document.getElementById("btn").addEventListener("click", () => {
      count++;
      countEl.textContent = count;
      const li = document.createElement("li");
      li.textContent = "Clicked #" + count;
      list.append(li);
    });
  </script>
</body>
</html>`
      },
      mistakes: ['The script runs before the element exists, so it gets «null».', 'Typos such as «getElementByID» or «addEventListner».', 'Using «innerHTML» with user input (an XSS risk). Use «textContent».', 'Writing «onclick="fn()"» but defining «fn» inside a module scope.'],
      related: ['js-async', 'js-this', 'rest-api']
    }
  ]);
})();
