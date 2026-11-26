/* CodeMentor KB — Java, C and C++ errors */
(function () {
  'use strict';
  window.CM.kb.add('errors', [
    /* ============================ JAVA ============================ */
    {
      id: 'java-semicolon', lang: 'java', title: "error: ';' expected",
      re: [/error:\s*';' expected/i],
      kw: ["';' expected", 'semicolon expected'],
      what: 'The Java compiler expected a semicolon to end a statement.',
      causes: ['A missing «;» at the end of the line **above** the one reported.', 'Unbalanced parentheses, so the compiler thinks the statement continues.', 'A typo in a keyword that makes the line unreadable.'],
      fix: `~~~java bad
int x = 5
System.out.println(x)
~~~
~~~java good
int x = 5;
System.out.println(x);
~~~
Statements end with «;». Lines that open a block («if (...) {», «class X {», method headers) do **not**.`,
      concept: 'Java ignores line breaks. The semicolon is what tells the compiler where a statement ends.',
      related: ['compilation']
    },
    {
      id: 'java-cannot-find-symbol', lang: 'java', title: 'error: cannot find symbol',
      re: [/error:\s*cannot find symbol[\s\S]{0,200}?symbol:\s*(?:variable|method|class)\s+([\w]+)/i, /error:\s*cannot find symbol/i],
      kw: ['cannot find symbol'], dflt: ['a name'], suggestName: true,
      what: 'The compiler does not recognise «$1»: there is no variable, method or class with that name visible here.',
      causes: ['A typo or wrong case: «system.out.println», «string», «Sytem», «length()» on an array.', 'Missing «import» (e.g. «Scanner», «ArrayList», «HashMap»).', 'The variable was declared inside another block or method (scope).', 'Calling a method with the wrong argument types.'],
      fix: `~~~java bad
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        string name = sc.nextLine();
        system.out.println(name.lenght());
    }
}
~~~
~~~java good
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String name = sc.nextLine();
        System.out.println(name.length());
    }
}
~~~`,
      concept: 'Java resolves every name at **compile time**. Classes in «java.lang» (String, System, Math) are automatic, but everything else must be imported, and Java is case-sensitive.',
      tips: ['Arrays use «arr.length» (no parentheses), Strings use «s.length()» and lists use «list.size()».'],
      related: ['scope', 'compilation', 'strings']
    },
    {
      id: 'java-npe', lang: 'java', title: 'NullPointerException',
      re: [/java\.lang\.NullPointerException(?::\s*(.*))?/i, /NullPointerException/i],
      kw: ['nullpointerexception', 'null pointer exception', 'npe'], dflt: ['(no message)'],
      what: 'Your code used a reference that is «null»: it points to no object, so there is nothing to call methods on. Message: $1',
      causes: ['An object field was declared but never created with «new» (e.g. «int[] arr;», «List<String> list;»).', 'A method returned «null» (e.g. «map.get(key)» for a missing key).', 'An array of objects was created, but its elements are all «null»: «new Student[5]».', 'Calling «.equals()» on a null string.'],
      fix: `~~~java bad
class Course {
    List<String> students;               // null!
    void add(String s) { students.add(s); }
}
~~~
~~~java good
class Course {
    List<String> students = new ArrayList<>();
    void add(String s) { students.add(s); }
}

if (name != null && name.equals("admin")) { ... }
if ("admin".equals(name)) { ... }        // null-safe comparison
~~~
Java 14+ prints a helpful message such as *Cannot invoke "String.length()" because "name" is null*, which names the null variable.`,
      concept: 'Object variables in Java hold **references**. Declaring a variable does not create an object; «new» does. The default value of object fields and array elements is «null».',
      related: ['classes-objects', 'memory-management']
    },
    {
      id: 'java-aioobe', lang: 'java', title: 'ArrayIndexOutOfBoundsException',
      re: [/(Array|String)IndexOutOfBoundsException:?\s*(?:Index\s*)?(-?\d+)?(?:\s*out of bounds for length\s*(\d+))?/i, /IndexOutOfBoundsException:\s*Index:?\s*(\d+),?\s*Size:?\s*(\d+)/i],
      kw: ['arrayindexoutofboundsexception', 'indexoutofboundsexception', 'stringindexoutofboundsexception', 'out of bounds for length'], dflt: ['Array', 'an index', 'its length'],
      what: 'You accessed index $2, but valid indexes are only «0» to «length - 1» (length $3).',
      causes: ['Loop condition «i <= arr.length» instead of «i < arr.length».', 'Accessing «arr[i + 1]» in the last iteration.', 'Using an index from user input without checking it.', 'An empty array or list.'],
      fix: `~~~java bad
int[] marks = {70, 80, 90};
for (int i = 0; i <= marks.length; i++) {
    System.out.println(marks[i]);
}
~~~
~~~java good
int[] marks = {70, 80, 90};
for (int i = 0; i < marks.length; i++) {
    System.out.println(marks[i]);
}
for (int m : marks) System.out.println(m);   // enhanced for: no index to get wrong
~~~`,
      concept: 'Java checks every array access at runtime. Indexes start at 0, so the last valid index is «length - 1».',
      related: ['arrays-lists', 'loops']
    },
    {
      id: 'java-nfe', lang: 'java', title: 'NumberFormatException',
      re: [/NumberFormatException:\s*For input string:\s*"(.*)"/i, /NumberFormatException(?::\s*(.*))?/i],
      kw: ['numberformatexception', 'for input string'], dflt: ['the text'],
      what: '«Integer.parseInt» / «Double.parseDouble» received «$1», which is not a valid number.',
      causes: ['Empty string or whitespace (e.g. a leftover newline after «nextInt»).', 'Decimal text passed to «parseInt».', 'Extra characters such as spaces, commas or units.'],
      fix: `~~~java good
String text = sc.nextLine().trim();
try {
    int n = Integer.parseInt(text);
} catch (NumberFormatException e) {
    System.out.println("Please enter a whole number");
}
~~~`,
      concept: 'Parsing is strict. Validate or catch errors when converting user input.',
      related: ['type-conversion', 'exceptions']
    },
    {
      id: 'java-input-mismatch', lang: 'java', title: 'InputMismatchException / nextLine() skipped',
      re: [/java\.util\.InputMismatchException/i, /InputMismatchException/i, /NoSuchElementException:\s*No line found/i],
      kw: ['inputmismatchexception', 'nextline skipped', 'nextline not working', 'scanner skips input', 'no line found'],
      what: 'The «Scanner» read input of the wrong type, or ran out of input.',
      causes: ['Typing text where «nextInt()» expected a number.', '**The classic trap:** «nextInt()» leaves the Enter key («\\n») behind, so the next «nextLine()» immediately returns an empty string.', 'No more input available (NoSuchElementException).'],
      fix: `~~~java bad
int age = sc.nextInt();
String name = sc.nextLine();      // returns "" immediately!
~~~
~~~java good
int age = sc.nextInt();
sc.nextLine();                    // consume the leftover newline
String name = sc.nextLine();

// or read everything as lines and parse:
int age2 = Integer.parseInt(sc.nextLine().trim());
~~~`,
      concept: '«nextInt()», «nextDouble()» and similar read only the **token**, not the line break after it. «nextLine()» reads up to the next line break, which is still waiting in the buffer.',
      related: ['type-conversion', 'strings']
    },
    {
      id: 'java-lossy', lang: 'java', title: 'error: incompatible types: possible lossy conversion',
      re: [/error:\s*incompatible types:\s*possible lossy conversion from (\w+) to (\w+)/i, /error:\s*incompatible types:\s*(\w+) cannot be converted to (\w+)/i],
      kw: ['incompatible types', 'possible lossy conversion', 'cannot be converted to'], dflt: ['one type', 'another'],
      what: 'You assigned a «$1» value to a «$2» variable, and Java will not do that conversion automatically.',
      causes: ['Assigning a «double» result (e.g. «Math.pow», «Math.sqrt», or any math with a decimal) to an «int».', 'Assigning a «String» to an «int» (use «Integer.parseInt»).', 'A method returns a different type than the variable you are storing it in.'],
      fix: `~~~java bad
int area = Math.pow(side, 2);
int n = "42";
~~~
~~~java good
int area = (int) Math.pow(side, 2);   // explicit cast (truncates)
double area2 = Math.pow(side, 2);     // or use the wider type
int n = Integer.parseInt("42");
~~~`,
      concept: 'Java is **statically typed**. Narrowing (double → int, long → int) can lose information, so it needs an explicit cast to show you mean it.',
      related: ['type-conversion', 'variables']
    },
    {
      id: 'java-missing-return', lang: 'java', title: 'error: missing return statement',
      re: [/error:\s*missing return statement/i],
      kw: ['missing return statement'],
      what: 'A method declared to return a value has at least one path through it that ends without «return».',
      causes: ['Returning only inside an «if», with no return for the «else» case.', 'Returning inside a loop that might run zero times.'],
      fix: `~~~java bad
static boolean isEven(int n) {
    if (n % 2 == 0) {
        return true;
    }
}
~~~
~~~java good
static boolean isEven(int n) {
    if (n % 2 == 0) {
        return true;
    }
    return false;          // every path returns
    // simpler: return n % 2 == 0;
}
~~~`,
      concept: 'The compiler checks **all possible paths**. If any of them can reach the end of a non-void method, it is an error.',
      related: ['functions', 'conditionals']
    },
    {
      id: 'java-static-context', lang: 'java', title: 'error: non-static … cannot be referenced from a static context',
      re: [/error:\s*non-static (method|variable) ([\w(), ]+?) cannot be referenced from a static context/i],
      kw: ['cannot be referenced from a static context', 'non-static method', 'non-static variable'], dflt: ['member', 'it'],
      what: 'You used the instance $1 «$2» from a **static** method (like «main») without an object.',
      causes: ['Calling a helper method from «main» that is not marked «static».', 'Using an instance field directly in «main».'],
      fix: `~~~java bad
public class Main {
    int add(int a, int b) { return a + b; }
    public static void main(String[] args) {
        System.out.println(add(2, 3));
    }
}
~~~
~~~java good
public class Main {
    static int add(int a, int b) { return a + b; }    // option 1: make it static
    public static void main(String[] args) {
        System.out.println(add(2, 3));
        // option 2: new Main().someInstanceMethod();
    }
}
~~~`,
      concept: 'Static code belongs to the class and runs without any object. Instance members belong to an object, so you need one («new Main()») to use them.',
      related: ['static', 'classes-objects']
    },
    {
      id: 'java-public-class-file', lang: 'java', title: 'error: class X is public, should be declared in a file named X.java',
      re: [/error:\s*class (\w+) is public, should be declared in a file named (\w+\.java)/i],
      kw: ['should be declared in a file named', 'is public, should be declared'], dflt: ['Main', 'Main.java'],
      what: 'The public class «$1» must live in a file called «$2».',
      causes: ['The file was saved under a different name (e.g. «program.java», «Main (1).java»).', 'A different capitalisation («main.java» vs «Main.java»).'],
      fix: `Rename the file to «$2», or rename the class to match the file name. Each «.java» file can contain **one** public class, and its name must match the file name exactly (case-sensitive).`,
      concept: 'Java maps public class names to file names so the compiler and the JVM can find classes on disk.',
      related: ['compilation']
    },
    {
      id: 'java-main-class', lang: 'java', title: 'Error: Could not find or load main class',
      re: [/Error:\s*Could not find or load main class\s*([\w.]+)/i, /error:\s*no main method found|Main method not found in class (\w+)/i],
      kw: ['could not find or load main class', 'main method not found'], dflt: ['Main'],
      what: 'The JVM could not start «$1»: either it can\'t find the compiled class, or the class has no valid «main» method.',
      causes: ['Running «java Main.class» or «java main» instead of «java Main».', 'You did not compile first, or you are in the wrong folder.', 'The class is inside a «package», so you must run it with its full name from the root folder.', 'The «main» signature is wrong: it must be «public static void main(String[] args)».'],
      fix: `~~~bash
javac Main.java      # creates Main.class
java Main            # no .class extension
# Java 11+: run a single file directly
java Main.java
~~~`,
      concept: 'The JVM loads classes by their fully qualified name from the classpath, and starts at the exact method «public static void main(String[])».',
      related: ['compilation', 'static']
    },
    {
      id: 'java-uninitialized', lang: 'java', title: 'error: variable might not have been initialized',
      re: [/error:\s*variable (\w+) might not have been initialized/i],
      kw: ['might not have been initialized'], dflt: ['the variable'],
      what: 'The local variable «$1» could be used before it gets a value on some path through the code.',
      causes: ['It is only assigned inside an «if» or a loop.', 'Declared without an initial value: «int sum;».'],
      fix: `~~~java bad
int sum;
for (int x : nums) sum += x;
~~~
~~~java good
int sum = 0;
for (int x : nums) sum += x;
~~~`,
      concept: 'Unlike fields, **local** variables get no default value in Java. The compiler proves every local is assigned before it is read.',
      related: ['variables', 'scope']
    },
    {
      id: 'java-cme', lang: 'java', title: 'ConcurrentModificationException',
      re: [/ConcurrentModificationException/i],
      kw: ['concurrentmodificationexception'],
      what: 'A collection was modified while it was being iterated over with a for-each loop or an iterator.',
      causes: ['Calling «list.remove(x)» or «list.add(x)» inside «for (X x : list)».'],
      fix: `~~~java bad
for (String s : names) if (s.isEmpty()) names.remove(s);
~~~
~~~java good
names.removeIf(String::isEmpty);            // Java 8+

Iterator<String> it = names.iterator();
while (it.hasNext()) if (it.next().isEmpty()) it.remove();
~~~`,
      concept: 'Iterators detect structural changes that happen behind their back and fail fast, rather than returning wrong results.',
      related: ['arrays-lists', 'loops']
    },
    {
      id: 'java-stackoverflow', lang: 'java', title: 'StackOverflowError',
      re: [/java\.lang\.StackOverflowError/i, /StackOverflowError/i],
      kw: ['stackoverflowerror', 'stack overflow error'],
      what: 'The call stack ran out of space, almost always because of recursion that never stops.',
      causes: ['A recursive method with a missing or unreachable base case.', 'A constructor that creates another instance of its own class.', '«toString()», «equals()» or «hashCode()» calling each other in a cycle.'],
      fix: `~~~java good
static int factorial(int n) {
    if (n <= 1) return 1;          // base case
    return n * factorial(n - 1);   // moves toward the base case
}
~~~`,
      concept: 'Every method call adds a stack frame. Recursion needs a reachable base case.',
      related: ['recursion']
    },
    {
      id: 'java-arith', lang: 'java', title: 'ArithmeticException: / by zero',
      re: [/ArithmeticException:\s*\/ by zero/i, /ArithmeticException/i],
      kw: ['arithmeticexception', '/ by zero'],
      what: 'An integer division or modulo by zero.',
      causes: ['Dividing by a count that is 0 (e.g. an average of an empty array).', 'User input of 0.'],
      fix: `~~~java good
if (count == 0) {
    System.out.println("No data");
} else {
    double avg = (double) sum / count;
}
~~~
(Floating-point division by zero gives «Infinity» or «NaN» instead of throwing.)`,
      concept: 'Integer division by zero has no defined result, so the JVM throws. Always guard against edge cases.',
      related: ['exceptions', 'operators']
    },
    {
      id: 'java-classcast', lang: 'java', title: 'ClassCastException',
      re: [/ClassCastException:?\s*(?:class\s*)?([\w.]+) cannot be cast to (?:class\s*)?([\w.]+)/i, /ClassCastException/i],
      kw: ['classcastexception', 'cannot be cast to'], dflt: ['one type', 'another'],
      what: 'You cast an object to «$2», but it is actually a «$1».',
      causes: ['Downcasting to the wrong subclass.', 'Raw collections (no generics) holding mixed types.'],
      fix: `~~~java good
if (shape instanceof Circle c) {     // Java 16+ pattern matching
    System.out.println(c.radius);
}
List<String> names = new ArrayList<>();   // use generics, not raw List
~~~`,
      concept: 'A cast does not convert an object. It only tells the compiler "trust me, it\'s this type", and the JVM checks that at runtime.',
      related: ['inheritance', 'polymorphism']
    },

    /* ============================ C / C++ ============================ */
    {
      id: 'c-segfault', lang: 'c', title: 'Segmentation fault (core dumped)',
      re: [/Segmentation fault/i, /SIGSEGV/i, /exit(?:ed with)? code[:\s]*(?:139|-1073741819|3221225477)/i, /Access violation/i],
      kw: ['segmentation fault', 'segfault', 'sigsegv', 'core dumped', 'access violation', '3221225477'],
      what: 'Your program tried to read or write memory it does not own, so the operating system killed it.',
      causes: ['**«scanf» without «&»**: «scanf("%d", n)» instead of «scanf("%d", &n)».', 'Array index out of bounds (e.g. «i <= n» in a loop, or a negative index).', 'Dereferencing a «NULL» or uninitialised pointer.', 'Using memory after «free()», or returning a pointer to a local variable.', 'Infinite recursion (stack overflow).', 'Writing to a string literal: «char *s = "hi"; s[0] = \'H\';».'],
      fix: `~~~c bad
int n;
scanf("%d", n);               // passes the VALUE of n as an address!
int arr[5];
for (int i = 0; i <= 5; i++) arr[i] = i;
~~~
~~~c good
int n;
scanf("%d", &n);              // pass the address
int arr[5];
for (int i = 0; i < 5; i++) arr[i] = i;
~~~
**Find the line:** compile with «-g -fsanitize=address» (gcc/clang) and run again. AddressSanitizer reports the exact line and the bad access.`,
      concept: 'Every process has its own memory regions. C does **no bounds checking**, so a bad pointer or index reads or writes outside them, and the OS stops the program with SIGSEGV.',
      tips: ['On Windows the same crash often shows as exit code 3221225477 (0xC0000005).'],
      related: ['pointers', 'arrays-lists', 'memory-management']
    },
    {
      id: 'c-expected-semicolon', lang: 'c', title: "error: expected ';' before …",
      re: [/error:\s*expected ';' (?:before|at end of) ['‘]?([^'’\n]*)['’]?/i, /error:\s*expected ';'/i],
      kw: ["expected ';'", 'expected semicolon'], dflt: ['the next token'],
      what: 'The compiler expected a «;» before «$1». The missing semicolon is usually at the end of the **previous** line.',
      causes: ['Missing «;» after a statement, or after a «struct»/«class» definition (C++ needs «};»).', 'Missing «)» in a function call.'],
      fix: `~~~c bad
int x = 10
printf("%d", x)
struct Point { int x, y; }
~~~
~~~c good
int x = 10;
printf("%d", x);
struct Point { int x, y; };
~~~`,
      concept: 'C/C++ ignore newlines, so «;» marks the end of each statement. Struct and class definitions also end with «;».',
      related: ['compilation']
    },
    {
      id: 'c-undefined-reference', lang: 'c', title: 'undefined reference to … (linker error)',
      re: [/undefined reference to [`'‘]?([\w:~<>]+)[`'’]?/i, /unresolved external symbol\s*"?([^"\s]+)/i, /ld returned 1 exit status/i],
      kw: ['undefined reference', 'unresolved external symbol', 'ld returned 1 exit status', 'linker error'], dflt: ['a function'],
      what: 'The code compiled, but the **linker** could not find the definition of «$1».',
      causes: ['A function was declared (prototype) but never defined, or the definition has a different name or signature.', '«undefined reference to main»: no «main» function, a misspelling («Main», «mian»), or compiling a file that is not your main program.', 'You forgot to compile or link another «.c»/«.cpp» file: «gcc main.c utils.c».', 'Missing library flag, e.g. «-lm» for «sqrt»/«pow» in C.', 'C++: a static member or template that is declared but not defined.'],
      fix: `~~~bash
gcc main.c utils.c -o app        # compile all source files together
gcc main.c -o app -lm            # link the math library
~~~
Check that every declared function has a body somewhere, with exactly the same name and parameters.`,
      concept: 'Building C/C++ has two stages: **compile** each file into object code, then **link** them together. Declarations satisfy the compiler, but the linker needs the actual definitions.',
      related: ['compilation', 'functions']
    },
    {
      id: 'c-implicit-decl', lang: 'c', title: 'implicit declaration of function',
      re: [/(?:warning|error):\s*implicit declaration of function ['‘]?(\w+)['’]?/i],
      kw: ['implicit declaration of function'], dflt: ['the function'],
      what: '«$1» was used before the compiler saw a declaration for it.',
      causes: ['A missing «#include»: «printf»/«scanf» → «<stdio.h>», «malloc»/«exit» → «<stdlib.h>», «strlen»/«strcpy» → «<string.h>», «sqrt»/«pow» → «<math.h>».', 'Your own function is defined **below** «main» with no prototype above it.', 'A typo in the function name.'],
      fix: `~~~c good
#include <stdio.h>
#include <string.h>

int square(int x);            // prototype before use

int main() {
    printf("%d %zu\\n", square(4), strlen("hi"));
    return 0;
}

int square(int x) { return x * x; }
~~~`,
      concept: 'C compiles top to bottom. A function must be **declared** (by a header or a prototype) before it is called, so the compiler knows its parameter and return types.',
      related: ['functions', 'compilation']
    },
    {
      id: 'cpp-not-declared', lang: 'cpp', title: "error: 'x' was not declared in this scope",
      re: [/error:\s*['‘](\w+)['’] was not declared in this scope/i, /error:\s*use of undeclared identifier ['‘](\w+)['’]/i, /error:\s*['‘](\w+)['’] undeclared/i, /error C2065:\s*'(\w+)':\s*undeclared identifier/i],
      kw: ['was not declared in this scope', 'undeclared identifier', 'undeclared'], dflt: ['the name'], suggestName: true,
      what: 'The compiler does not know any «$1» at this point in the code.',
      causes: ['«cout»/«cin»/«endl»/«string»/«vector» used without «#include» **and** without «std::» / «using namespace std;».', 'A typo, or a variable declared inside another block (scope).', 'A function used before it is declared.'],
      fix: `~~~cpp bad
int main() {
    cout << "Hello" << endl;
}
~~~
~~~cpp good
#include <iostream>
using namespace std;          // or write std::cout, std::endl

int main() {
    cout << "Hello" << endl;
    return 0;
}
~~~`,
      concept: 'Standard library names live in the «std» namespace and in specific headers. You need both the header (the declaration) and the namespace qualification.',
      related: ['scope', 'compilation']
    },
    {
      id: 'c-scanf-format', lang: 'c', title: "format '%d' expects argument of type 'int *'",
      re: [/format ['‘]%(\w+)['’] expects argument of type ['‘]([^'’]+)['’], but argument (\d+) has type ['‘]([^'’]+)['’]/i],
      kw: ['format expects argument of type', "expects argument of type 'int *'"], dflt: ['d', 'int *', '2', 'int'],
      what: 'The «%$1» in your format string expects a «$2», but argument $3 is a «$4».',
      causes: ['«scanf» needs **addresses**: «&x» (except for char arrays/strings).', 'Format/type mismatch: «%d» for a double, or «%f» for an int.', '«%lf» is for «double» in scanf, «%f» for «float».'],
      fix: `~~~c bad
int age; double gpa;
scanf("%d %f", age, gpa);
~~~
~~~c good
int age; double gpa;
scanf("%d %lf", &age, &gpa);
printf("%d %.2f\\n", age, gpa);
~~~
| Type | printf | scanf |
|---|---|---|
| int | %d | %d (with &) |
| double | %f / %lf | %lf (with &) |
| float | %f | %f (with &) |
| char | %c | " %c" (with &) |
| string (char[]) | %s | %s (no &) |`,
      concept: '«printf»/«scanf» are *variadic*: they trust the format string to say what each argument is. A mismatch reads the wrong bytes, which is undefined behaviour (often garbage or a crash).',
      related: ['pointers', 'type-conversion']
    },
    {
      id: 'cpp-no-match-operator', lang: 'cpp', title: "error: no match for 'operator<<' / 'operator>>'",
      re: [/error:\s*no match for ['‘]operator(<<|>>|==|\+|<)['’]/i, /error:\s*invalid operands (?:of types [^\n]+ )?to binary ['‘]?operator?([^'’\s]+)/i],
      kw: ['no match for operator', 'invalid operands to binary'], dflt: ['<<'],
      what: 'There is no «operator$1» defined for the types involved.',
      causes: ['Printing a «vector», «struct» or class directly: «cout << v;».', 'Mixing up the arrows: «cin << x» or «cout >> x».', 'Comparing incompatible types.'],
      fix: `~~~cpp bad
vector<int> v = {1, 2, 3};
cout << v;
cin << n;
~~~
~~~cpp good
for (int x : v) cout << x << " ";
cin >> n;          // data flows INTO n
cout << n;         // data flows OUT to cout
~~~
To print your own type, overload «operator<<»:
~~~cpp
ostream& operator<<(ostream& os, const Point& p) { return os << "(" << p.x << ", " << p.y << ")"; }
~~~`,
      concept: 'In C++, «<<» and «>>» are ordinary operators that the stream library overloads for built-in types. Your own types need their own overloads.',
      related: ['polymorphism']
    },
    {
      id: 'c-control-reaches-end', lang: 'c', title: 'warning: control reaches end of non-void function',
      re: [/control reaches end of non-void function/i, /not all control paths return a value/i],
      kw: ['control reaches end of non-void function', 'not all control paths return a value'],
      what: 'A function that should return a value can reach its end without returning anything.',
      causes: ['Returning only inside an «if» or a loop.', 'Forgetting «return» in a helper function.'],
      fix: `~~~c bad
int maxOf(int a, int b) {
    if (a > b) return a;
    else if (b > a) return b;
}
~~~
~~~c good
int maxOf(int a, int b) {
    return a > b ? a : b;
}
~~~`,
      concept: 'If execution falls off the end of a non-void function, the returned value is **undefined behaviour**: random garbage, or a crash.',
      related: ['functions', 'conditionals']
    },
    {
      id: 'c-lvalue', lang: 'c', title: 'error: lvalue required as left operand of assignment',
      re: [/lvalue required as left operand of assignment/i, /expression is not assignable/i],
      kw: ['lvalue required', 'expression is not assignable'],
      what: 'The left side of «=» is not something you can store into.',
      causes: ['Writing «=» where you meant «==» in a condition that has an expression on the left: «if (x + 1 = 5)».', 'Assignment written backwards: «5 = x;».', 'Assigning to a function call result or an array name.'],
      fix: `~~~c bad
if (a % 2 = 0) printf("even");
~~~
~~~c good
if (a % 2 == 0) printf("even");
~~~`,
      concept: 'An **lvalue** is something with a storage location (a variable or an array element). Only lvalues can appear on the left of «=».',
      related: ['operators']
    },
    {
      id: 'c-double-free', lang: 'c', title: 'free(): double free / invalid pointer / heap corruption',
      re: [/free\(\):\s*(double free detected[^\n]*|invalid pointer|invalid size)/i, /double free or corruption/i, /malloc\(\):\s*corrupted/i, /heap-use-after-free|heap-buffer-overflow/i],
      kw: ['double free', 'invalid pointer', 'heap corruption', 'use after free', 'heap-buffer-overflow'], dflt: ['heap corruption'],
      what: 'Memory management went wrong ($1): memory was freed twice, freed incorrectly, or written past its end.',
      causes: ['Calling «free(p)» twice on the same pointer.', 'Freeing a pointer that did not come from malloc (a stack array, or a pointer you moved with «p++»).', 'Writing past the end of a malloc\'d buffer (forgetting room for «\'\\0\'»).'],
      fix: `~~~c good
char *s = malloc(strlen(src) + 1);   // +1 for the '\\0' terminator
strcpy(s, src);
free(s);
s = NULL;                            // freeing NULL again is harmless
~~~
Compile with «-g -fsanitize=address» to find the exact line.`,
      concept: 'The allocator keeps bookkeeping data next to your blocks. Corrupting it or freeing twice breaks that bookkeeping, and the program aborts.',
      related: ['memory-management', 'pointers']
    },
    {
      id: 'c-stack-smashing', lang: 'c', title: '*** stack smashing detected ***',
      re: [/stack smashing detected/i, /stack-buffer-overflow/i, /Run-Time Check Failure #2/i],
      kw: ['stack smashing detected', 'stack-buffer-overflow'],
      what: 'Your program wrote past the end of a local (stack) array and overwrote nearby memory.',
      causes: ['A «char» buffer too small for the input plus «\'\\0\'».', '«gets» or «scanf("%s")» without a width limit.', 'Loop bounds that run past the array size.'],
      fix: `~~~c bad
char name[10];
gets(name);            // unsafe: no length check (removed in C11)
~~~
~~~c good
char name[50];
fgets(name, sizeof name, stdin);      // bounded
name[strcspn(name, "\\n")] = '\\0';     // strip the trailing newline
scanf("%49s", name);                  // or limit the width
~~~`,
      concept: 'C arrays have a fixed size and no bounds checks. The compiler places a "canary" value after buffers, and when it changes, the program aborts instead of continuing with corrupted memory.',
      related: ['arrays-lists', 'strings', 'memory-management']
    },
    {
      id: 'c-fpe', lang: 'c', title: 'Floating point exception (core dumped)',
      re: [/Floating point exception/i, /SIGFPE/i, /Integer division by zero/i],
      kw: ['floating point exception', 'sigfpe', 'integer division by zero'],
      what: 'Despite the name, this is almost always an **integer division or modulo by zero**.',
      causes: ['«x / 0» or «x % 0», e.g. a loop variable starting at 0 used as a divisor.', 'Averaging with a count of 0.'],
      fix: `~~~c bad
for (int i = 0; i < n; i++) if (n % i == 0) count++;
~~~
~~~c good
for (int i = 1; i <= n; i++) if (n % i == 0) count++;
~~~`,
      concept: 'The CPU raises an arithmetic trap on integer division by zero. Unix reports it as SIGFPE for historical reasons.',
      related: ['operators', 'loops']
    },
    {
      id: 'cpp-multiple-definition', lang: 'cpp', title: 'multiple definition of / redefinition of',
      re: [/multiple definition of [`'‘]?([\w:]+)/i, /error:\s*redefinition of ['‘]?([^'’\n]+)/i, /already defined in/i],
      kw: ['multiple definition', 'redefinition of', 'already defined'], dflt: ['a symbol'],
      what: '«$1» is defined more than once.',
      causes: ['Defining functions or global variables in a **header** that is included by several «.cpp» files.', 'Missing include guards, so a header is included twice.', '«#include "file.cpp"» instead of compiling it separately.'],
      fix: `~~~cpp title="utils.h"
#pragma once                    // include guard
int add(int a, int b);          // declaration only
extern int counter;             // declare globals with extern
~~~
~~~cpp title="utils.cpp"
#include "utils.h"
int add(int a, int b) { return a + b; }   // single definition
int counter = 0;
~~~`,
      concept: 'The **One Definition Rule**: you can declare something many times, but define it exactly once across the whole program.',
      related: ['compilation']
    }
  ]);
})();
