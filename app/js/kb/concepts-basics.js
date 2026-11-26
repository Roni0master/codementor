/* CodeMentor KB — programming fundamentals */
(function () {
  'use strict';
  window.CM.kb.add('concepts', [
    {
      id: 'variables', title: 'Variables & Data Types', cat: 'Basics', level: 'Beginner',
      aliases: ['variable', 'variables', 'data type', 'data types', 'datatype', 'datatypes', 'primitive types', 'declare variable', 'declaration', 'int float string boolean', 'boolean', 'static typing', 'dynamic typing'],
      summary: 'A variable is a named box in memory that stores a value. Its data type decides what kind of value it holds and what you can do with it.',
      analogy: 'Think of labelled jars in a kitchen. The label is the variable name, the contents are the value, and the jar type is the data type. You would not pour soup into a cereal box.',
      explain: `A **variable** gives a name to a value so you can use and change it later. A **data type** tells the computer what kind of value it is, how much memory it needs, and which operations make sense.

| Type | Examples | Used for |
|---|---|---|
| Integer («int») | «42», «-7» | counting, indexes |
| Floating point («float», «double») | «3.14», «-0.5» | decimals, measurements |
| String | «"hello"» | text |
| Boolean | «true» / «false» | yes/no decisions |
| Array / List | «[1, 2, 3]» | collections of values |

**Static vs dynamic typing**
- **Java, C, C++, C#** — you declare the type: «int age = 20;». The compiler checks types *before* the program runs.
- **Python, JavaScript** — the type belongs to the value: «age = 20». Types are checked *while* the program runs.`,
      deep: `### What happens in memory
- An «int» is usually **4 bytes** (32 bits) → range about ±2.1 billion. Go past it in Java/C and it **overflows** (wraps around to negative). Python ints grow automatically.
- Floats use the **IEEE-754** format, so many decimals can't be stored exactly: «0.1 + 0.2» gives «0.30000000000000004». Never compare floats with «==»; check «abs(a - b) < 1e-9» instead.
- A variable for an object/list usually stores a **reference** (an address), not the data itself. See ${'[mutability](ask:' + encodeURIComponent('explain mutable vs immutable') + ')'}.

### Naming rules (almost every language)
- Letters, digits and «_»; **cannot start with a digit**; no spaces; case-sensitive («Age» ≠ «age»).
- Conventions: «snake_case» in Python, «camelCase» in Java/JS, «UPPER_CASE» for constants.`,
      code: {
        python: `name = "Asha"        # str
age = 20             # int
gpa = 8.7            # float
is_enrolled = True   # bool

print(type(age))     # <class 'int'>
age = age + 1        # variables can be updated
print(f"{name} is {age} years old")`,
        javascript: `const name = "Asha";   // string (const = can't be reassigned)
let age = 20;          // number
let gpa = 8.7;         // number (JS has one number type)
let isEnrolled = true; // boolean

console.log(typeof age); // "number"
age = age + 1;
console.log(name + " is " + age + " years old");`,
        java: `public class Main {
    public static void main(String[] args) {
        String name = "Asha";
        int age = 20;
        double gpa = 8.7;
        boolean isEnrolled = true;

        age = age + 1;
        System.out.println(name + " is " + age + " years old");
    }
}`,
        cpp: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string name = "Asha";
    int age = 20;
    double gpa = 8.7;
    bool isEnrolled = true;

    age = age + 1;
    cout << name << " is " << age << " years old" << endl;
    return 0;
}`,
        c: `#include <stdio.h>

int main() {
    char name[] = "Asha";
    int age = 20;
    double gpa = 8.7;

    age = age + 1;
    printf("%s is %d years old (GPA %.1f)\\n", name, age, gpa);
    return 0;
}`
      },
      mistakes: ['Using a variable before giving it a value.', 'Mixing types, e.g. «"5" + 5». Convert first.', 'Comparing floats with «==». Use a small tolerance instead.', 'Invalid names such as «2nd_score» or «my score».', 'Integer overflow in Java/C when values exceed the type range.'],
      practice: ['Swap two variables, with and without a temporary variable.', 'Read a temperature in Celsius and print it in Fahrenheit.', 'Print the type of five different values in your language.'],
      quiz: [
        { q: 'Which is NOT a valid variable name in most languages?', o: ['total_sum', '_count', '2ndValue', 'userName'], a: 2, why: 'Variable names cannot start with a digit.' },
        { q: 'In Python, what does «type("5")» return?', o: ["<class 'int'>", "<class 'str'>", "<class 'float'>", 'An error'], a: 1, why: 'Anything inside quotes is a string, even if it looks like a number.' }
      ],
      related: ['type-conversion', 'operators', 'scope', 'python-mutability']
    },
    {
      id: 'type-conversion', title: 'Type Conversion & Casting', cat: 'Basics', level: 'Beginner',
      aliases: ['type casting', 'casting', 'typecast', 'convert string to int', 'implicit conversion', 'explicit conversion', 'type coercion', 'coercion', 'parse int', 'parseint', 'int()', 'str()', 'convert type'],
      summary: 'Changing a value from one data type to another, either automatically (implicit) or on purpose (explicit casting).',
      analogy: 'Like currency: 100 rupees and 100 dollars both say "100", but you must convert one before you can add them.',
      explain: `**Implicit conversion** happens automatically when it is safe: «5 + 2.0» becomes «7.0», because the int is widened to a float.

**Explicit conversion (casting)** is when you ask for it: «int("42")», «(int) 3.9», «Number("7")».

> [!WARNING] The #1 beginner trap
> User input is **always text**. «input()» in Python, «prompt()» in JS and «Scanner.nextLine()» in Java all give you a **string**. Convert it before doing math.

| Language | String → int | Number → string |
|---|---|---|
| Python | «int(s)» | «str(n)» |
| JavaScript | «Number(s)» / «parseInt(s, 10)» | «String(n)» |
| Java | «Integer.parseInt(s)» | «String.valueOf(n)» |
| C++ | «stoi(s)» | «to_string(n)» |
| C | «atoi(s)» / «strtol» | «sprintf» |

Casting a decimal to an integer **truncates** (cuts off) and does not round: «(int) 3.99» is «3».`,
      deep: `### JavaScript's automatic coercion
JavaScript converts types aggressively:
- «"5" + 1» → «"51"» (the + operator joins strings)
- «"5" - 1» → «4» (the - operator only works on numbers)
- «"5" == 5» → «true», but «"5" === 5» → «false»

### Narrowing vs widening
- **Widening** (int → double) is safe and automatic.
- **Narrowing** (double → int, long → int) can lose data, so Java requires an explicit cast: «int x = (int) 9.7;».`,
      code: {
        python: `age_text = input("Enter your age: ")   # always a str!
age = int(age_text)                     # convert to int
print("Next year you'll be", age + 1)

price = float("19.99")
print(int(price))      # 19  (truncates)
print(round(price))    # 20  (rounds)
print(str(42) + "!")   # "42!"`,
        javascript: `const input = "42";
console.log(input + 1);           // "421"  (string concatenation!)
console.log(Number(input) + 1);   // 43
console.log(parseInt("42px", 10)); // 42 (parses leading digits)
console.log(Number("42px"));      // NaN (whole string must be numeric)
console.log(String(3.5) + "!");   // "3.5!"`,
        java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        String text = "42";
        int n = Integer.parseInt(text);   // String -> int
        double d = 9.99;
        int truncated = (int) d;          // 9 (explicit narrowing cast)
        double avg = (double) 7 / 2;      // 3.5 instead of 3
        System.out.println(n + 1 + " " + truncated + " " + avg);
    }
}`,
        cpp: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string s = "42";
    int n = stoi(s);                  // string -> int
    double d = 9.99;
    int t = static_cast<int>(d);      // 9
    string back = to_string(n) + "!";
    cout << n + 1 << " " << t << " " << back << endl;
}`
      },
      mistakes: ['Doing math on raw input without converting it.', 'Expecting casts to round. They truncate.', '«int("3.5")» raises ValueError in Python. Use «int(float("3.5"))».', 'Integer division before casting: «(double)(7/2)» is still 3.0.'],
      quiz: [
        { q: 'In JavaScript, what is «"5" + 2»?', o: ['7', '"52"', 'NaN', 'Error'], a: 1, why: '+ with a string joins the values as text.' },
        { q: 'What does «(int) 3.99» give in Java?', o: ['4', '3', '3.99', 'Compile error'], a: 1, why: 'Casting to int truncates toward zero.' }
      ],
      related: ['variables', 'operators', 'strings']
    },
    {
      id: 'operators', title: 'Operators', cat: 'Basics', level: 'Beginner',
      aliases: ['operator', 'arithmetic operators', 'modulo', 'modulus', 'remainder', 'integer division', 'floor division', 'logical operators', 'comparison operators', 'relational operators', 'increment', 'decrement', 'compound assignment', 'operator precedence', 'precedence', 'ternary operator', 'bitwise'],
      summary: 'Symbols that do something with values: math, comparisons, logic and assignment.',
      analogy: 'Operators are the verbs of code: values are the nouns, and operators say what to do with them.',
      explain: `| Category | Operators | Example |
|---|---|---|
| Arithmetic | «+ - * / %» | «7 % 3» → «1» |
| Comparison | «== != < > <= >=» | «a >= 18» |
| Logical | «and or not» (Py) / «&& \\|\\| !» | «age > 18 && hasId» |
| Assignment | «= += -= *=» | «score += 10» |
| Increment | «++ --» (not in Python) | «i++» |

**Division is different per language**
- Python: «7 / 2» → «3.5», «7 // 2» → «3» (floor division)
- Java/C/C++: «7 / 2» → «3» (int / int = int!), «7.0 / 2» → «3.5»
- JavaScript: «7 / 2» → «3.5»

**Modulo «%»** gives the remainder. It is useful for even/odd checks («n % 2 == 0»), getting the last digit («n % 10») and wrapping around («(i + 1) % size»).`,
      deep: `### Precedence (highest → lowest, simplified)
1. «()» parentheses
2. «**» power (Python), unary «- !»
3. «* / // %»
4. «+ -»
5. comparisons «< > == !=»
6. «not» / «!»
7. «and» / «&&»
8. «or» / «||»
9. assignment «=»

When in doubt, **add parentheses**. They cost nothing and help readers.

### Short-circuit evaluation
«a && b» does not evaluate «b» if «a» is false. This lets you write safe checks like «if (user != null && user.isAdmin())».

### «i++» vs «++i»
Both add 1. «i++» returns the *old* value and «++i» returns the *new* value. This only matters inside bigger expressions, so avoid relying on it.`,
      code: {
        python: `a, b = 17, 5
print(a / b)    # 3.4   true division
print(a // b)   # 3     floor division
print(a % b)    # 2     remainder
print(2 ** 10)  # 1024  power
print(a > 10 and b < 10)  # True
x = 5
x += 3          # x is now 8`,
        javascript: `const a = 17, b = 5;
console.log(a / b);        // 3.4
console.log(Math.floor(a / b)); // 3
console.log(a % b);        // 2
console.log(2 ** 10);      // 1024
console.log(5 == "5", 5 === "5"); // true false
let i = 0; i++;            // i is 1`,
        java: `int a = 17, b = 5;
System.out.println(a / b);          // 3  (integer division!)
System.out.println((double) a / b); // 3.4
System.out.println(a % b);          // 2
System.out.println(Math.pow(2, 10)); // 1024.0
boolean ok = a > 10 && b < 10;      // true`
      },
      mistakes: ['Using «=» (assignment) where you meant «==» (comparison).', 'Integer division surprise in Java/C: «5 / 2 == 2».', '«^» is XOR, not power. Use «**» (Python/JS) or «Math.pow» / «pow».', 'Precedence slips: «a + b / 2» is not the average. Write «(a + b) / 2».'],
      quiz: [
        { q: 'What is «17 % 5»?', o: ['3', '2', '3.4', '12'], a: 1, why: '17 = 5×3 + 2, so the remainder is 2.' },
        { q: 'In Java, «7 / 2» evaluates to…', o: ['3.5', '4', '3', '3.0'], a: 2, why: 'int / int performs integer division, which truncates.' }
      ],
      related: ['variables', 'conditionals', 'type-conversion']
    },
    {
      id: 'conditionals', title: 'Conditionals (if / else / switch)', cat: 'Basics', level: 'Beginner',
      aliases: ['if else', 'if statement', 'else if', 'elif', 'switch', 'switch case', 'ternary', 'conditional', 'conditions', 'nested if', 'decision making', 'match case', 'if condition'],
      summary: 'Conditionals let your program choose between different paths depending on whether a condition is true or false.',
      analogy: 'A traffic signal: if it is red, stop; else if it is yellow, slow down; else go.',
      explain: `A condition is any expression that is **true or false**. The first branch whose condition is true runs, and the rest are skipped.

~~~python
marks = 72
if marks >= 90:
    grade = "A"
elif marks >= 75:
    grade = "B"
elif marks >= 50:
    grade = "C"
else:
    grade = "F"
~~~

**Order matters.** Put the most specific or highest condition first. If «marks >= 50» came first, a 95 would get a "C".

**switch / match** is a neat way to compare one value against many constants. In C/Java/JS remember the «break»!

**Ternary**: a one-line if/else for picking a value: «status = "adult" if age >= 18 else "minor"» (Python) or «age >= 18 ? "adult" : "minor"».`,
      deep: `### Truthy and falsy
In Python and JS, non-boolean values act like booleans in conditions:
- Falsy in Python: «0», «""», «[]», «{}», «None», «False»
- Falsy in JS: «0», «""», «null», «undefined», «NaN», «false» (but «[]» is **truthy**!)

### Guard clauses
Instead of deep nesting, return early:
~~~python
def withdraw(balance, amount):
    if amount <= 0:
        return "Invalid amount"
    if amount > balance:
        return "Insufficient funds"
    return balance - amount
~~~`,
      code: {
        python: `age = int(input("Age: "))
if age < 13:
    print("Child")
elif age < 18:
    print("Teen")
else:
    print("Adult")

label = "even" if age % 2 == 0 else "odd"`,
        javascript: `const day = 3;
switch (day) {
  case 1: console.log("Mon"); break;
  case 2: console.log("Tue"); break;
  case 3: console.log("Wed"); break;   // without break it would "fall through"
  default: console.log("Other");
}
const label = day % 2 === 0 ? "even" : "odd";`,
        java: `int marks = 72;
String grade;
if (marks >= 90) grade = "A";
else if (marks >= 75) grade = "B";
else if (marks >= 50) grade = "C";
else grade = "F";
System.out.println(grade);`,
        c: `#include <stdio.h>
int main() {
    int n;
    scanf("%d", &n);
    if (n > 0) printf("positive\\n");
    else if (n < 0) printf("negative\\n");
    else printf("zero\\n");
    return 0;
}`
      },
      mistakes: ['«if x = 5» assigns instead of comparing. Use «==».', 'Python: «if x == 1 or 2» is always true. Write «x == 1 or x == 2» or «x in (1, 2)».', 'Forgetting «break» in a switch causes fall-through.', 'A semicolon after «if (cond);» in C/Java ends the if immediately.', 'Wrong order of conditions, so a general case catches everything first.'],
      quiz: [
        { q: 'In Python, «if x == 1 or 2:» is…', o: ['True only when x is 1 or 2', 'Always True', 'A syntax error', 'Always False'], a: 1, why: 'It parses as (x == 1) or (2), and 2 is truthy.' },
        { q: 'What happens in a C/Java switch case without «break»?', o: ['Compile error', 'Execution falls through to the next case', 'Only that case runs', 'The program crashes'], a: 1, why: 'Without break, control continues into the following cases.' }
      ],
      related: ['operators', 'loops', 'functions']
    },
    {
      id: 'loops', title: 'Loops (for, while, do-while)', cat: 'Basics', level: 'Beginner',
      aliases: ['loop', 'for loop', 'while loop', 'do while', 'iteration', 'iterate', 'break', 'continue', 'nested loop', 'nested loops', 'infinite loop', 'for each', 'foreach', 'range', 'for in', 'for of', 'repeat code'],
      summary: 'Loops repeat a block of code, either a fixed number of times (for) or as long as a condition stays true (while).',
      analogy: '"Do 10 push-ups" is a for loop: you know the count. "Keep running until you are tired" is a while loop: you check a condition each time.',
      explain: `**for loop** is used when you know how many times, or you are walking through a collection.
**while loop** is used when you repeat until something changes.
**do-while** (C/Java/JS) always runs at least once and then checks.

Anatomy of a C-style for loop:
~~~java
for (int i = 0; i < 5; i++) { ... }
//   start      condition  update
~~~
1. **start** runs once, 2. **condition** is checked before each round, 3. the **body** runs, 4. the **update** runs, then back to step 2.

| Keyword | Effect |
|---|---|
| «break» | exit the loop immediately |
| «continue» | skip to the next iteration |

**Nested loops** run the inner loop completely for each step of the outer loop: 3 outer × 4 inner = 12 runs.`,
      deep: `### Off-by-one errors
For an array of length «n», valid indexes are «0 … n-1». So use «i < n», not «i <= n». In Python «range(n)» already stops at «n-1».

### Infinite loops
A while loop needs **something inside it that eventually makes the condition false**:
~~~python bad
i = 0
while i < 5:
    print(i)        # i never changes, so this loops forever
~~~
~~~python good
i = 0
while i < 5:
    print(i)
    i += 1
~~~

### Complexity
One loop over «n» items is O(n). Two nested loops over «n» are O(n²). That matters when n reaches 100,000.`,
      code: {
        python: `for i in range(5):          # 0,1,2,3,4
    print(i)

fruits = ["apple", "mango", "kiwi"]
for idx, fruit in enumerate(fruits):
    print(idx, fruit)

n = 10
while n > 0:
    if n == 4:
        break
    n -= 3
print(n)  # 4`,
        javascript: `for (let i = 0; i < 5; i++) console.log(i);

const fruits = ["apple", "mango", "kiwi"];
for (const fruit of fruits) console.log(fruit);   // values
fruits.forEach((f, i) => console.log(i, f));

let n = 10;
while (n > 0) { n -= 3; }`,
        java: `for (int i = 0; i < 5; i++) System.out.println(i);

int[] marks = {70, 85, 90};
for (int m : marks) System.out.println(m);   // for-each

int n = 1;
do {
    System.out.println("runs at least once");
} while (n < 0);`,
        cpp: `#include <iostream>
#include <vector>
using namespace std;
int main() {
    vector<int> v = {3, 1, 4};
    for (int i = 0; i < (int)v.size(); i++) cout << v[i] << " ";
    for (int x : v) cout << x << " ";       // range-based for
    int n = 3;
    while (n--) cout << "hi ";
}`
      },
      mistakes: ['Infinite loops: forgetting to update the loop variable.', 'Off-by-one: «i <= arr.length» goes one past the end.', 'A stray semicolon «for (...);» gives the loop an empty body.', 'Changing a list while looping over it.', 'Reusing the same loop variable name in nested loops.'],
      practice: ['Print the multiplication table of a number.', 'Sum all digits of a number using a while loop.', 'Print a right-angled star triangle with nested loops.'],
      quiz: [
        { q: 'How many times does «for (i = 0; i < 5; i++)» run?', o: ['4', '5', '6', 'Infinite'], a: 1, why: 'i takes values 0,1,2,3,4: five iterations.' },
        { q: 'What does «continue» do?', o: ['Exits the loop', 'Skips to the next iteration', 'Restarts the loop from 0', 'Pauses the program'], a: 1, why: 'continue skips the rest of the current iteration only.' }
      ],
      related: ['arrays-lists', 'big-o', 'conditionals', 'recursion']
    },
    {
      id: 'functions', title: 'Functions & Methods', cat: 'Basics', level: 'Beginner',
      aliases: ['function', 'functions', 'method', 'methods', 'parameters', 'parameter', 'arguments', 'argument', 'return', 'return value', 'return statement', 'def', 'void', 'function call', 'call a function', 'define function', 'parameter vs argument', 'default arguments', 'return vs print'],
      summary: 'A function is a named, reusable block of code that takes inputs (parameters), does a job and can give back a result (return value).',
      analogy: 'A vending machine: you give it inputs (money and a button) and it returns a snack. You do not need to know how it works inside, you just use it.',
      explain: `You **define** a function once and **call** it as many times as you like.

~~~python
def area(width, height):      # width, height = parameters
    return width * height     # send the result back

print(area(3, 4))             # 3, 4 = arguments, prints 12
~~~

- **Parameters** are the names in the definition. **Arguments** are the actual values you pass in.
- **«return»** sends a value back to the caller and **ends** the function.
- A function with no return gives back «None» (Python), «undefined» (JS), or is declared «void» (Java/C).

> [!TIP] return vs print
> «print» shows something on screen for a human. «return» hands a value back to your code so it can be used further. A function that only prints cannot be used in a calculation.

**Why functions?** They avoid repeating code (DRY), give a name to an idea, and can be tested one at a time.`,
      deep: `### The call stack
Every call creates a **stack frame** holding its parameters and local variables. When the function returns, its frame is removed. This is why local variables vanish after the call, and why endless recursion causes a *stack overflow*.

### Pure functions vs side effects
A **pure** function depends only on its inputs and changes nothing outside itself, which makes it easy to test. Printing, writing files or changing global variables are **side effects**.

### Passing arguments
- Primitives (numbers, booleans) are copied.
- Objects/lists: the function gets a reference to the **same object**, so changes inside are visible outside. See [pass by value vs reference](ask:difference between pass by value and pass by reference).`,
      code: {
        python: `def greet(name, greeting="Hello"):   # default parameter
    return f"{greeting}, {name}!"

def is_even(n):
    return n % 2 == 0

print(greet("Ravi"))               # Hello, Ravi!
print(greet("Ravi", "Hi"))         # Hi, Ravi!
print(is_even(10))                 # True`,
        javascript: `function add(a, b) {
  return a + b;
}
const square = (x) => x * x;          // arrow function
const greet = (name = "friend") => "Hi " + name;

console.log(add(2, 3), square(4), greet());`,
        java: `public class Main {
    static int add(int a, int b) {          // returns an int
        return a + b;
    }
    static void greet(String name) {        // returns nothing
        System.out.println("Hello " + name);
    }
    public static void main(String[] args) {
        System.out.println(add(2, 3));
        greet("Ravi");
    }
}`,
        cpp: `#include <iostream>
using namespace std;

int add(int a, int b) { return a + b; }
void greet(string name = "friend") { cout << "Hi " << name << endl; }

int main() {
    cout << add(2, 3) << endl;
    greet();
}`,
        c: `#include <stdio.h>

int max(int a, int b);          // prototype (declare before use)

int main() {
    printf("%d\\n", max(4, 9));
    return 0;
}

int max(int a, int b) {
    return a > b ? a : b;
}`
      },
      mistakes: ['Forgetting «return», so you get «None»/«undefined» back.', 'Printing inside the function when the caller needed the value returned.', 'Calling with the wrong number of arguments.', 'Python: calling a function above where it is defined at module level.', 'C: using a function before its prototype, which causes an "implicit declaration" warning.'],
      quiz: [
        { q: 'What does a Python function return if it has no return statement?', o: ['0', 'An empty string', 'None', 'An error'], a: 2, why: 'Functions without return implicitly return None.' },
        { q: 'In «def f(x):» and «f(5)», what is 5?', o: ['A parameter', 'An argument', 'A return value', 'A keyword'], a: 1, why: 'Values passed at the call site are arguments; names in the definition are parameters.' }
      ],
      related: ['scope', 'recursion', 'js-closures']
    },
    {
      id: 'scope', title: 'Scope (local vs global)', cat: 'Basics', level: 'Beginner',
      aliases: ['variable scope', 'local variable', 'global variable', 'block scope', 'function scope', 'lexical scope', 'global keyword', 'nonlocal', 'shadowing', 'lifetime of variable', 'local vs global'],
      summary: 'Scope decides where in your code a variable can be seen and used.',
      analogy: 'House rules: rules in your bedroom (local) apply only there, while house rules (global) apply everywhere. A bedroom rule with the same name overrides the house rule inside the bedroom. That is called shadowing.',
      explain: `| Scope | Visible where | Example |
|---|---|---|
| **Global** | everywhere in the file/module | a variable at the top level |
| **Function / local** | only inside that function | parameters and variables created in the function |
| **Block** | only inside «{ }» | «let»/«const» in JS, variables in Java/C blocks |

- **Python** has *function* scope. An «if» or «for» block does **not** create a new scope.
- **JavaScript** «let»/«const» are *block*-scoped, while «var» is *function*-scoped.
- **Java/C/C++**: every «{ }» block is a scope.

**Python's rule (LEGB):** names are looked up in **L**ocal → **E**nclosing function → **G**lobal → **B**uilt-in.`,
      deep: `### Modifying a global in Python
Reading a global inside a function works, but **assigning** to it makes Python treat the name as local for the *whole* function:
~~~python bad
count = 0
def inc():
    count += 1     # UnboundLocalError!
~~~
~~~python good
count = 0
def inc():
    global count
    count += 1
~~~
A better design is usually to pass values in and return results, instead of relying on globals.

### Lifetime
Local variables are created when the function is called and destroyed when it returns. That is why a function cannot "remember" a local between calls, unless you use a closure, a class or a static variable.`,
      code: {
        python: `x = "global"

def show():
    x = "local"        # shadows the global x
    print(x)           # local

show()
print(x)               # global`,
        javascript: `if (true) {
  var a = 1;   // function/global scoped
  let b = 2;   // block scoped
}
console.log(a); // 1
console.log(typeof b); // "undefined" (b does not exist out here)`,
        java: `public class Main {
    static int total = 0;              // class-level (shared)
    public static void main(String[] args) {
        for (int i = 0; i < 3; i++) {  // i exists only inside the loop
            total += i;
        }
        // System.out.println(i);      // error: cannot find symbol
        System.out.println(total);
    }
}`
      },
      mistakes: ['Expecting a variable created inside a function to exist outside it.', 'Python: assigning to a global inside a function without «global», which causes UnboundLocalError.', 'Accidentally shadowing an outer variable or a built-in (e.g. naming a variable «list» or «str»).', 'JS: using «var» in loops with callbacks. Use «let».'],
      quiz: [
        { q: 'In Python, does a variable created inside an «if» block exist after the block?', o: ['No, it is block-scoped', 'Yes, Python has function scope, not block scope', 'Only if declared global', 'Only in Python 2'], a: 1, why: 'Python blocks do not create scopes; only functions, classes and modules do.' }
      ],
      related: ['functions', 'js-hoisting', 'js-closures', 'variables']
    },
    {
      id: 'arrays-lists', title: 'Arrays & Lists', cat: 'Data Structures', level: 'Beginner',
      aliases: ['array', 'arrays', 'list', 'lists', 'arraylist', 'vector', 'index', 'indexing', 'zero indexing', 'zero based', '0 based index', '2d array', 'matrix', 'multidimensional array', 'append', 'push', 'slice', 'slicing', 'array length', 'dynamic array'],
      summary: 'An ordered collection of items stored under one name, where each item is reached by its position (index), starting from 0.',
      analogy: 'A row of numbered lockers starting at locker 0. If you know the number you can open any locker directly, without walking past the others.',
      explain: `~~~text
index:   0    1    2    3
value: [ 10 | 20 | 30 | 40 ]      length = 4, last index = 3
~~~
- The **first** element is at index «0» and the **last** is at «length - 1».
- Accessing «arr[4]» above is *out of range*: IndexError, ArrayIndexOutOfBoundsException or undefined behaviour in C.

| Language | Fixed size | Growable |
|---|---|---|
| Python | n/a | «list» |
| JavaScript | n/a | «Array» |
| Java | «int[]» | «ArrayList<Integer>» |
| C++ | «int a[10]», «array» | «vector<int>» |
| C | «int a[10]» | manual «malloc/realloc» |

| Operation | Time |
|---|---|
| Read/write «a[i]» | **O(1)** |
| Append at end | **O(1)** amortized |
| Insert/delete at front or middle | **O(n)** (elements shift) |
| Search unsorted | **O(n)** |`,
      deep: `### Why is access O(1)?
Elements sit **next to each other in memory**. The address of «a[i]» is just «base + i × size_of_element», a single calculation however big the array is. That is also why indexes start at 0: the first element is at an offset of 0.

### Dynamic arrays grow by doubling
When a Python list or ArrayList fills up, it allocates a bigger block (about 1.5–2×) and copies everything over. Appends are still O(1) *on average* (amortized).

### Copy vs reference
~~~python
a = [1, 2, 3]
b = a          # same list, two names
b.append(4)
print(a)       # [1, 2, 3, 4]  surprise!
c = a.copy()   # a real copy
~~~`,
      code: {
        python: `nums = [10, 20, 30, 40]
print(nums[0], nums[-1])   # 10 40  (negative index = from the end)
nums.append(50)            # add to end
nums.insert(0, 5)          # add at front (O(n))
print(nums[1:3])           # slice -> [10, 20]
print(len(nums))           # 6
matrix = [[1, 2], [3, 4]]
print(matrix[1][0])        # 3`,
        javascript: `const nums = [10, 20, 30, 40];
console.log(nums[0], nums[nums.length - 1]); // 10 40
nums.push(50);           // add to end
nums.unshift(5);         // add to front
console.log(nums.slice(1, 3)); // [10, 20]
const doubled = nums.map(n => n * 2);
console.log(nums.includes(30)); // true`,
        java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        int[] fixed = {10, 20, 30};          // size can't change
        System.out.println(fixed.length);   // 3 (field, no parentheses)

        List<Integer> list = new ArrayList<>();
        list.add(10); list.add(20);
        System.out.println(list.get(1));    // 20
        System.out.println(list.size());    // 2 (method)
        System.out.println(Arrays.toString(fixed));
    }
}`,
        cpp: `#include <iostream>
#include <vector>
using namespace std;
int main() {
    vector<int> v = {10, 20, 30};
    v.push_back(40);
    cout << v[0] << " " << v.back() << " " << v.size() << endl;
    int grid[2][3] = {{1,2,3},{4,5,6}};
    cout << grid[1][2] << endl;   // 6
}`,
        c: `#include <stdio.h>
int main() {
    int a[5] = {10, 20, 30, 40, 50};
    int n = sizeof(a) / sizeof(a[0]);   // 5
    for (int i = 0; i < n; i++) printf("%d ", a[i]);
    return 0;
}`
      },
      mistakes: ['Off-by-one: the last index is «length - 1», so loop with «i < length».', 'Java: «arr.length» (field) vs «list.size()» vs «str.length()».', 'Copying a reference («b = a») when you meant to copy the list.', 'C: arrays don\'t know their size once passed to a function. Pass the length too.', 'Using «list.pop(0)» or «insert(0, x)» in a loop is O(n) each time.'],
      practice: ['Find the second largest number in an array.', 'Reverse an array in place.', 'Rotate an array by k positions.', 'Remove duplicates from a sorted array.'],
      quiz: [
        { q: 'For an array of length n, what is the index of the last element?', o: ['n', 'n - 1', 'n + 1', '-n'], a: 1, why: 'Indexes start at 0, so the last one is n-1.' },
        { q: 'What is the time complexity of accessing a[i]?', o: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], a: 0, why: 'The address is computed directly from the index.' }
      ],
      related: ['loops', 'strings', 'linked-list', 'big-o', 'two-pointers']
    },
    {
      id: 'strings', title: 'Strings', cat: 'Basics', level: 'Beginner',
      aliases: ['string', 'text', 'character', 'char', 'substring', 'concatenation', 'concatenate', 'immutable string', 'string methods', 'split', 'join', 'string formatting', 'f-string', 'f string', 'stringbuilder', 'string builder', 'string comparison'],
      summary: 'A string is a sequence of characters used to represent text. In most languages strings are immutable, so operations create new strings.',
      analogy: 'A string is like a necklace of letter beads: you can look at any bead by position, but in most languages you build a new necklace rather than swapping a bead.',
      explain: `Strings are indexed like arrays: «"hello"[1]» is «"e"».

| Task | Python | JavaScript | Java |
|---|---|---|---|
| Length | «len(s)» | «s.length» | «s.length()» |
| Upper case | «s.upper()» | «s.toUpperCase()» | «s.toUpperCase()» |
| Find | «s.find("x")» | «s.indexOf("x")» | «s.indexOf("x")» |
| Substring | «s[1:4]» | «s.slice(1, 4)» | «s.substring(1, 4)» |
| Split | «s.split(",")» | «s.split(",")» | «s.split(",")» |
| Replace | «s.replace(a, b)» | «s.replaceAll(a, b)» | «s.replace(a, b)» |
| Equal? | «a == b» | «a === b» | «a.equals(b)» |

**Immutable** means «s.upper()» does not change «s». It **returns a new string**, so you must store it: «s = s.upper()».`,
      deep: `### Building strings in a loop
Because strings are immutable, «result += piece» inside a big loop copies the whole string each time, which is O(n²) overall.
- Python: collect pieces in a list and then «"".join(pieces)»
- Java: use «StringBuilder»
- JS: push to an array and «join("")», or just use «+=» (engines optimise it well)

### C strings
In C a string is a «char» array that ends with the null character «'\\0'». «char s[5] = "hello";» has **no room** for «'\\0'», so you need «char s[6]». Always use «strcmp» to compare, never «==».

### Comparing in Java
«==» checks whether two variables point to the **same object**. «.equals()» checks whether the **text** is the same. Always use «.equals()» for content.`,
      code: {
        python: `s = "Hello, World"
print(s.lower(), s[0], s[-1])     # hello, world H d
print(s[7:])                      # World
words = s.split(", ")             # ['Hello', 'World']
print("-".join(words))            # Hello-World
name, age = "Asha", 20
print(f"{name} is {age}")         # f-string formatting
print("World" in s)               # True`,
        javascript: `const s = "Hello, World";
console.log(s.toLowerCase(), s[0], s.at(-1));
console.log(s.slice(7));               // "World"
console.log(s.split(", "));            // ["Hello", "World"]
const name = "Asha", age = 20;
console.log(\`\${name} is \${age}\`);     // template literal
console.log(s.includes("World"));      // true`,
        java: `String s = "Hello, World";
System.out.println(s.toLowerCase() + " " + s.charAt(0));
System.out.println(s.substring(7));          // World
String a = new String("hi"), b = "hi";
System.out.println(a == b);                  // false (different objects)
System.out.println(a.equals(b));             // true  (same text)
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 3; i++) sb.append(i);
System.out.println(sb.toString());           // 012`,
        c: `#include <stdio.h>
#include <string.h>
int main() {
    char s[20] = "Hello";
    strcat(s, " C");                  // s = "Hello C"
    printf("%s has %zu chars\\n", s, strlen(s));
    if (strcmp(s, "Hello C") == 0) printf("equal\\n");
    return 0;
}`
      },
      mistakes: ['Java: comparing strings with «==» instead of «.equals()».', 'Python: «s[0] = "H"» fails because strings are immutable. Build a new string instead.', 'Forgetting to store the result: «s.upper()» alone does nothing.', 'C: buffers too small for the «\'\\0\'» terminator, or comparing with «==».', 'Concatenating inside big loops instead of using join/StringBuilder.'],
      quiz: [
        { q: 'In Java, which correctly checks if two strings have the same text?', o: ['a == b', 'a.equals(b)', 'a = b', 'a.compare(b)'], a: 1, why: '== compares references; equals compares contents.' }
      ],
      related: ['arrays-lists', 'type-conversion', 'python-mutability']
    },
    {
      id: 'recursion', title: 'Recursion', cat: 'Algorithms', level: 'Intermediate',
      aliases: ['recursive', 'recursive function', 'base case', 'recursive case', 'recursive call', 'function calls itself', 'recursion tree', 'tail recursion'],
      summary: 'Recursion is when a function solves a problem by calling itself on a smaller version of the same problem, until it reaches a simple base case.',
      analogy: 'Russian nesting dolls: to reach the smallest doll you open one doll, then do the exact same thing to the doll inside, until there is a doll that does not open. That last doll is the base case.',
      explain: `Every recursive function needs two parts:
1. **Base case**: a simple input you can answer directly, without recursing. This stops the recursion.
2. **Recursive case**: break the problem into a **smaller** version and call yourself.

~~~python
def factorial(n):
    if n <= 1:                      # base case
        return 1
    return n * factorial(n - 1)     # recursive case (smaller n)
~~~

**Tracing «factorial(3)»:**
~~~text
factorial(3) = 3 * factorial(2)
                   factorial(2) = 2 * factorial(1)
                                      factorial(1) = 1      ← base case
                   factorial(2) = 2 * 1 = 2
factorial(3) = 3 * 2 = 6
~~~
Each call waits on the **call stack** until the call below it returns, and then the results are combined on the way back up.

**When is recursion natural?** Trees and graphs, divide and conquer (merge sort, binary search), backtracking (permutations, N-Queens), and anything defined in terms of itself.`,
      deep: `### The call stack and stack overflow
Each call uses a stack frame. Python's default limit is about 1000 frames (RecursionError), and Java/C have fixed stack sizes (StackOverflowError / segfault). Deep recursion over large inputs often has to be rewritten as a loop.

### Recursion vs iteration
Any recursion can be written with a loop plus an explicit stack. Recursion is often **clearer**, while iteration is often **lighter on memory**.

### Avoiding repeated work: memoization
Naive Fibonacci recomputes the same values again and again, which is O(2ⁿ):
~~~python
from functools import lru_cache

@lru_cache(maxsize=None)
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)   # now O(n)
~~~
This idea is the heart of [dynamic programming](ask:explain dynamic programming).

### Complexity via recurrences
- «T(n) = T(n-1) + O(1)» → O(n) (factorial)
- «T(n) = 2T(n/2) + O(n)» → O(n log n) (merge sort)
- «T(n) = T(n-1) + T(n-2)» → O(2ⁿ) (naive Fibonacci)`,
      code: {
        python: `def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

def sum_digits(n):
    if n < 10:
        return n
    return n % 10 + sum_digits(n // 10)

print(factorial(5))      # 120
print(sum_digits(1234))  # 10`,
        javascript: `function factorial(n) {
  if (n <= 1) return 1;            // base case
  return n * factorial(n - 1);     // recursive case
}
function reverse(str) {
  if (str === "") return "";
  return reverse(str.slice(1)) + str[0];
}
console.log(factorial(5), reverse("abc")); // 120 "cba"`,
        java: `public class Main {
    static long factorial(int n) {
        if (n <= 1) return 1;
        return n * factorial(n - 1);
    }
    static int power(int x, int n) {      // x^n
        if (n == 0) return 1;
        return x * power(x, n - 1);
    }
    public static void main(String[] args) {
        System.out.println(factorial(5) + " " + power(2, 10));
    }
}`,
        cpp: `#include <iostream>
using namespace std;
int fib(int n) {
    if (n < 2) return n;              // base cases: fib(0)=0, fib(1)=1
    return fib(n - 1) + fib(n - 2);
}
int main() { cout << fib(10) << endl; }   // 55`
      },
      complexity: 'Depends on the recurrence. Factorial is O(n) time and O(n) stack space. Naive Fibonacci is O(2ⁿ) time.',
      mistakes: ['No base case, or a base case that is never reached, leads to infinite recursion and a stack overflow.', 'Not making the problem smaller (calling «f(n)» or «f(n+1)» instead of «f(n-1)»).', 'Forgetting to «return» the recursive call\'s result.', 'Exponential blow-up from recomputing the same subproblems. Use memoization.'],
      practice: ['Reverse a string recursively.', 'Compute xⁿ in O(log n) using recursion.', 'Print all subsets of [1, 2, 3].', 'Check if a string is a palindrome recursively.'],
      quiz: [
        { q: 'What stops a recursive function from calling itself forever?', o: ['The return type', 'The base case', 'A loop', 'The call stack'], a: 1, why: 'The base case returns directly without recursing.' },
        { q: 'Time complexity of naive recursive Fibonacci?', o: ['O(n)', 'O(n log n)', 'O(2ⁿ)', 'O(1)'], a: 2, why: 'Each call branches into two more calls, so the work roughly doubles at every level.' }
      ],
      related: ['functions', 'dynamic-programming', 'trees', 'stack', 'big-o']
    },
    {
      id: 'exceptions', title: 'Exception Handling (try / catch)', cat: 'Basics', level: 'Intermediate',
      aliases: ['exception', 'exceptions', 'exception handling', 'try catch', 'try except', 'try/catch', 'try except python', 'finally', 'throw', 'raise', 'error handling', 'custom exception', 'checked exception', 'unchecked exception', 'throws'],
      summary: 'A structured way to detect and respond to errors at runtime instead of letting the program crash.',
      analogy: 'A safety net under a trapeze artist. The act might go wrong (an exception is thrown), the net catches it, and the show goes on.',
      explain: `~~~python
try:
    n = int(input("Number: "))
    print(100 / n)
except ValueError:
    print("That wasn't a number")
except ZeroDivisionError:
    print("Can't divide by zero")
finally:
    print("This always runs")
~~~
- **try** wraps code that might fail.
- **catch / except** handles a *specific* kind of error.
- **finally** always runs, which makes it good for cleanup such as closing files.
- **throw / raise** signals an error yourself: «raise ValueError("age must be positive")».

**Catch specific exceptions.** A bare «except:» or «catch (Exception e)» also hides bugs you didn't expect.`,
      deep: `### Checked vs unchecked (Java)
- **Checked** exceptions (IOException, SQLException) must be caught or declared with «throws». The compiler enforces this.
- **Unchecked** exceptions (NullPointerException, ArithmeticException) extend RuntimeException. They usually mean a bug to fix rather than something to catch.

### Resource cleanup
- Python: «with open(path) as f:» closes the file automatically.
- Java: try-with-resources: «try (Scanner sc = new Scanner(file)) { ... }»
- C++: RAII (destructors clean up).

### Don't use exceptions for normal control flow
Checking «if key in dict» is clearer than catching KeyError every time. Use exceptions for exceptional situations.`,
      code: {
        python: `def safe_divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        return None

def set_age(age):
    if age < 0:
        raise ValueError("age must be non-negative")
    return age

print(safe_divide(10, 0))   # None`,
        javascript: `try {
  const data = JSON.parse('{"bad json}');
} catch (err) {
  console.log("Could not parse:", err.message);
} finally {
  console.log("done");
}

async function load() {
  try {
    const res = await fetch("/data.json");
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  } catch (e) { console.error(e); }
}`,
        java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        try {
            int[] a = new int[3];
            a[5] = 10;
        } catch (ArrayIndexOutOfBoundsException e) {
            System.out.println("Bad index: " + e.getMessage());
        } finally {
            System.out.println("cleanup");
        }
    }
}`,
        cpp: `#include <iostream>
#include <stdexcept>
using namespace std;
double divide(double a, double b) {
    if (b == 0) throw runtime_error("division by zero");
    return a / b;
}
int main() {
    try { cout << divide(1, 0); }
    catch (const exception& e) { cout << "Error: " << e.what() << endl; }
}`
      },
      mistakes: ['Silently swallowing errors with «except: pass» or an empty «catch {}».', 'Catching overly broad exceptions and hiding real bugs.', 'Using try/catch as a substitute for simple «if» checks.', 'Forgetting to close files or connections (use with / try-with-resources).'],
      quiz: [
        { q: 'When does a «finally» block run?', o: ['Only if no exception occurs', 'Only if an exception occurs', 'Always', 'Never in Python'], a: 2, why: 'finally runs whether or not an exception happened.' }
      ],
      related: ['debugging', 'stack-trace', 'functions']
    },
    {
      id: 'debugging', title: 'How to Debug Code', cat: 'Basics', level: 'Beginner',
      aliases: ['debug', 'debugging', 'how to debug', 'debugger', 'breakpoint', 'breakpoints', 'print debugging', 'find bug', 'fix bugs', 'rubber duck', 'logical error', 'logic error', 'runtime error', 'syntax error', 'types of errors', 'wrong output', 'my code is not working', 'code not working'],
      summary: 'Debugging is the systematic process of finding why code behaves differently from what you expect, and then fixing it.',
      analogy: 'Being a detective: collect clues (error messages, printed values), form a theory, test it, and narrow down the suspect line.',
      explain: `### The three kinds of errors
| Type | When | Example | Clue |
|---|---|---|---|
| **Syntax error** | before running | missing «:» or «;» | the editor/compiler points at a line |
| **Runtime error** | while running | dividing by zero, bad index | program crashes with an error message |
| **Logic error** | runs fine, wrong answer | «<» instead of «<=» | output is wrong, no error |

### A reliable 6-step method
1. **Read the error message**: the *last* line names the error type and the reason.
2. **Find the line number** in *your* file (skip library code).
3. **Reproduce** it with the smallest input that fails.
4. **Inspect values**: print variables just before the failing line, or use a debugger breakpoint.
5. **Form one hypothesis and change one thing** at a time.
6. **Explain the code line by line** to someone (or a rubber duck). You will often spot the bug mid-sentence.

> [!TIP] Paste it here
> Paste your **full error message** and **code** into the chat. I will point to the likely line, explain why it happens, and show the fix.`,
      deep: `### Using a debugger
- **Breakpoint**: pause execution at a line.
- **Step over**: run the current line and move to the next.
- **Step into**: go inside a function call.
- **Watch**: keep an eye on variable values as they change.
Available in VS Code, PyCharm, IntelliJ, browser DevTools (F12 → Sources) and gdb for C/C++.

### Advanced tactics
- **Binary search the bug**: comment out half the code, check whether the bug is still there, and repeat.
- **Assertions**: «assert total >= 0, "total went negative"» catches bad state early.
- **Write a tiny test** for the function you suspect.
- **Check assumptions**: is the input really an int, and is the list really sorted?`,
      code: {
        python: `def average(nums):
    total = 0
    for n in nums:
        total += n
    print("DEBUG total =", total, "len =", len(nums))  # inspect
    return total / len(nums)

assert average([2, 4]) == 3, "average is wrong"
# Use the built-in debugger: breakpoint()`,
        javascript: `function average(nums) {
  let total = 0;
  for (const n of nums) total += n;
  console.log({ total, len: nums.length }); // labelled debug print
  debugger;   // pauses here when DevTools is open
  return total / nums.length;
}`
      },
      mistakes: ['Changing many things at once, so you never know what fixed it.', 'Not reading the full error message, especially the last line.', 'Assuming instead of checking what a variable actually holds.', 'Debugging the wrong file or an old saved version.'],
      quiz: [
        { q: 'Your program runs without errors but prints the wrong answer. This is a…', o: ['Syntax error', 'Runtime error', 'Logic error', 'Compiler error'], a: 2, why: 'Logic errors produce wrong results without crashing.' }
      ],
      related: ['stack-trace', 'exceptions']
    },
    {
      id: 'stack-trace', title: 'Reading Error Messages & Stack Traces', cat: 'Basics', level: 'Beginner',
      aliases: ['stack trace', 'stacktrace', 'traceback', 'read traceback', 'error message', 'how to read error', 'how to read an error message', 'read error message', 'understand error', 'what does this error mean', 'call stack error', 'most recent call last'],
      summary: 'A stack trace is the report printed when a program crashes. It names the error and shows the chain of function calls that led to it.',
      explain: `### Python traceback: read it from the bottom up
~~~text
Traceback (most recent call last):
  File "main.py", line 8, in <module>
    print(average([]))
  File "main.py", line 4, in average
    return total / len(nums)
ZeroDivisionError: division by zero
~~~
- **Last line** is the error **type** and **reason**: «ZeroDivisionError: division by zero».
- The line just above it is **where** it happened: «main.py», line 4, inside «average».
- Lines further up show **who called it**: line 8 called «average([])».

### Java stack trace: read it from the top down
~~~text
Exception in thread "main" java.lang.NullPointerException: Cannot invoke "String.length()" because "name" is null
    at Main.greet(Main.java:5)
    at Main.main(Main.java:10)
~~~
- First line: exception type and message.
- The first «at ...» line in **your** class («Main.java:5») is where to look.

### JavaScript
~~~text
Uncaught TypeError: Cannot read properties of undefined (reading 'name')
    at showUser (app.js:12:24)
    at app.js:20:1
~~~
- «app.js:12:24» means file, line 12, column 24.

> [!TIP]
> Ignore frames from libraries and the framework, and focus on the first frame that points at **your** file.`,
      mistakes: ['Only reading the first line of a Python traceback (the cause is at the bottom).', 'Looking at library frames instead of your own code.', 'Not copying the full message when asking for help.'],
      related: ['debugging', 'exceptions']
    },
    {
      id: 'compilation', title: 'How Code Runs: Compiler vs Interpreter', cat: 'Basics', level: 'Beginner',
      aliases: ['compiler', 'interpreter', 'compilation', 'compile', 'jvm', 'bytecode', 'jit', 'how code runs', 'machine code', 'source code', 'compile time', 'runtime', 'compile time vs runtime', 'how does python run', 'how does java run', 'virtual machine'],
      summary: 'Your source code must be translated into something the CPU can run. Compilers translate ahead of time, interpreters translate while running, and many languages mix both.',
      analogy: 'A compiler is like translating a whole book before anyone reads it. An interpreter is like a live interpreter translating each sentence as it is spoken.',
      explain: `| Language | Pipeline | Result |
|---|---|---|
| **C / C++** | compiler (gcc, clang) → machine code | fast native «.exe», built per OS |
| **Java** | «javac» → bytecode «.class» → **JVM** (with a JIT compiler) | "write once, run anywhere" |
| **Python** | CPython compiles to bytecode «.pyc» → interpreter loop | easy and flexible, slower |
| **JavaScript** | engine (V8) parses → interprets → JIT-compiles hot code | runs in browsers and Node.js |

### Compile-time vs runtime errors
- **Compile-time**: caught before the program runs (missing «;», type mismatch in Java/C). Compiled languages catch more of these.
- **Runtime**: happen while running (null pointer, division by zero, index out of range).`,
      deep: `### The C build pipeline
1. **Preprocessor** expands «#include» and «#define».
2. **Compiler** turns the code into assembly and then object files («.o»).
3. **Linker** joins the object files and libraries into an executable. "undefined reference" errors come from this step.

### JIT (Just-In-Time) compilation
The JVM and V8 watch which code runs often ("hot" code) and compile it to machine code while the program runs. That is why Java and JS can be surprisingly fast.`,
      code: {
        bash: `# C
gcc main.c -o main && ./main
# C++
g++ main.cpp -o main && ./main
# Java
javac Main.java && java Main
# Python
python main.py
# JavaScript (Node.js)
node main.js`
      },
      related: ['debugging', 'memory-management']
    }
  ]);
})();
