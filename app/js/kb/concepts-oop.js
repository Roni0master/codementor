/* CodeMentor KB — object-oriented programming */
(function () {
  'use strict';
  window.CM.kb.add('concepts', [
    {
      id: 'oop', title: 'Object-Oriented Programming (OOP)', cat: 'OOP', level: 'Beginner',
      aliases: ['oop', 'oops', 'object oriented programming', 'object-oriented', 'object oriented', 'pillars of oop', 'four pillars', '4 pillars of oop', 'oops concepts', 'oop concepts', 'principles of oop'],
      summary: 'OOP organises code around objects, which are bundles of data (attributes) and behaviour (methods) modelled after real-world things.',
      analogy: 'A car blueprint is the class, and the actual cars built from it are objects. Every car has a colour and a speed (attributes) and can drive and brake (methods).',
      explain: `### The four pillars
| Pillar | One-line meaning | Everyday example |
|---|---|---|
| **Encapsulation** | keep data and the methods that use it together; hide internals | a capsule hides the medicine inside |
| **Abstraction** | expose only what is needed and hide complexity | you press "start" without knowing how the engine works |
| **Inheritance** | a class reuses and extends another class | «ElectricCar» is a «Car» |
| **Polymorphism** | the same call behaves differently per object | «shape.area()» for a circle vs a square |

### Why OOP?
- **Organisation**: code mirrors the problem (Student, Course, Library).
- **Reuse**: inheritance and composition avoid copy-paste.
- **Safety**: encapsulation stops other code from putting objects into invalid states.
- **Flexibility**: polymorphism lets you add new types without rewriting the callers.`,
      code: {
        python: `class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self._balance = balance          # "private" by convention

    def deposit(self, amount):
        if amount <= 0:
            raise ValueError("amount must be positive")
        self._balance += amount

    def balance(self):
        return self._balance

acc = BankAccount("Riya")
acc.deposit(500)
print(acc.owner, acc.balance())   # Riya 500`,
        java: `public class BankAccount {
    private String owner;
    private double balance;              // hidden (encapsulation)

    public BankAccount(String owner) { this.owner = owner; }

    public void deposit(double amount) {
        if (amount <= 0) throw new IllegalArgumentException("must be positive");
        balance += amount;
    }
    public double getBalance() { return balance; }

    public static void main(String[] args) {
        BankAccount acc = new BankAccount("Riya");
        acc.deposit(500);
        System.out.println(acc.getBalance());
    }
}`
      },
      mistakes: ['Making every field public, which defeats encapsulation.', 'Using inheritance where composition ("has-a") fits better.', 'Creating "god classes" that do everything.'],
      quiz: [
        { q: 'Which pillar is about hiding internal details behind methods?', o: ['Inheritance', 'Polymorphism', 'Encapsulation', 'Recursion'], a: 2, why: 'Encapsulation bundles data with methods and restricts direct access.' }
      ],
      related: ['classes-objects', 'inheritance', 'polymorphism', 'encapsulation', 'interfaces-abstract']
    },
    {
      id: 'classes-objects', title: 'Classes & Objects', cat: 'OOP', level: 'Beginner',
      aliases: ['class', 'classes', 'object', 'objects', 'instance', 'instances', 'constructor', 'constructors', '__init__', 'init method', 'self', 'this keyword java', 'attributes', 'instantiate', 'new keyword', 'instance variable', 'class variable', 'class vs object'],
      summary: 'A class is a blueprint, and an object is an actual thing built from that blueprint, with its own data.',
      analogy: 'A cookie cutter (class) and the cookies (objects). Every cookie has the same shape, but each can have different sprinkles.',
      explain: `- **Class**: defines which *attributes* (data) and *methods* (functions) objects will have.
- **Object / instance**: one concrete thing created from the class.
- **Constructor**: a special method that runs when an object is created and sets its initial state («__init__» in Python, the method with the class name in Java/C++, «constructor» in JS).
- **«self» / «this»**: refers to *the current object*, the one whose method is running.

| | Instance variable | Class (static) variable |
|---|---|---|
| Belongs to | each object | the class itself |
| Example | «student.name» | «Student.school_name» |
| Shared? | no, each object has its own | yes, one copy for all |`,
      code: {
        python: `class Student:
    school = "City College"            # class variable (shared)

    def __init__(self, name, marks):   # constructor
        self.name = name               # instance variables
        self.marks = marks

    def grade(self):                   # method: note the 'self' parameter
        return "Pass" if self.marks >= 40 else "Fail"

s1 = Student("Asha", 82)
s2 = Student("Ravi", 35)
print(s1.name, s1.grade(), s2.grade(), Student.school)`,
        javascript: `class Student {
  static school = "City College";
  constructor(name, marks) {
    this.name = name;
    this.marks = marks;
  }
  grade() {
    return this.marks >= 40 ? "Pass" : "Fail";
  }
}
const s1 = new Student("Asha", 82);
console.log(s1.name, s1.grade(), Student.school);`,
        java: `class Student {
    static String school = "City College";
    String name;
    int marks;

    Student(String name, int marks) {   // constructor
        this.name = name;               // this.name = field, name = parameter
        this.marks = marks;
    }
    String grade() { return marks >= 40 ? "Pass" : "Fail"; }
}

public class Main {
    public static void main(String[] args) {
        Student s1 = new Student("Asha", 82);
        System.out.println(s1.name + " " + s1.grade());
    }
}`,
        cpp: `#include <iostream>
#include <string>
using namespace std;

class Student {
public:
    string name;
    int marks;
    Student(string n, int m) : name(n), marks(m) {}   // initializer list
    string grade() const { return marks >= 40 ? "Pass" : "Fail"; }
};

int main() {
    Student s1("Asha", 82);
    cout << s1.name << " " << s1.grade() << endl;
}`
      },
      mistakes: ['Python: forgetting «self» as the first method parameter, which gives "takes 0 positional arguments but 1 was given".', 'Python: writing «self.name = name» outside a method, or forgetting the «self.» prefix.', 'Java/JS: forgetting «new», or calling an instance method from static «main».', 'Java: a constructor with a return type (e.g. «void Student()») is a method, not a constructor.', 'Python: mutable class attributes (e.g. «items = []») are shared between all objects.'],
      quiz: [
        { q: 'What does «self» refer to inside a Python method?', o: ['The class', 'The current object', 'The parent class', 'The module'], a: 1, why: 'self is the instance the method was called on.' },
        { q: 'A static/class variable is…', o: ['Unique per object', 'Shared by all instances', 'Only usable in constructors', 'Read-only'], a: 1, why: 'Static members belong to the class, so there is one shared copy.' }
      ],
      related: ['oop', 'inheritance', 'encapsulation', 'static']
    },
    {
      id: 'inheritance', title: 'Inheritance', cat: 'OOP', level: 'Intermediate',
      aliases: ['inherit', 'extends', 'subclass', 'superclass', 'parent class', 'child class', 'super', 'super()', 'super keyword', 'base class', 'derived class', 'multiple inheritance', 'multilevel inheritance', 'is-a relationship'],
      summary: 'Inheritance lets a new class (child) reuse and extend the attributes and methods of an existing class (parent).',
      analogy: 'You inherit traits from your parents (eye colour) but can also have your own (your hobbies), and you can do some things differently from them (overriding).',
      explain: `Use inheritance for an **"is-a"** relationship: a «Dog» *is an* «Animal», and a «SavingsAccount» *is a* «BankAccount».

- The child gets the parent's methods for free.
- The child can **add** new methods and **override** (replace) inherited ones.
- «super()» calls the parent's version, most often its constructor.

| Type | Meaning | Supported in |
|---|---|---|
| Single | one parent | all |
| Multilevel | A → B → C | all |
| Hierarchical | many children of one parent | all |
| Multiple | one child, many parents | Python, C++ (Java/C# use interfaces) |

> [!TIP] Composition over inheritance
> If the relationship is **"has-a"** (a Car *has an* Engine), store the other object as a field instead of inheriting from it.`,
      code: {
        python: `class Animal:
    def __init__(self, name):
        self.name = name
    def speak(self):
        return "..."

class Dog(Animal):                   # Dog inherits from Animal
    def __init__(self, name, breed):
        super().__init__(name)       # run the parent's constructor
        self.breed = breed
    def speak(self):                 # override
        return "Woof!"

d = Dog("Bruno", "Labrador")
print(d.name, d.speak(), isinstance(d, Animal))  # Bruno Woof! True`,
        java: `class Animal {
    protected String name;
    Animal(String name) { this.name = name; }
    String speak() { return "..."; }
}

class Dog extends Animal {
    Dog(String name) { super(name); }       // must be the first line
    @Override
    String speak() { return "Woof!"; }
}

public class Main {
    public static void main(String[] args) {
        Animal a = new Dog("Bruno");
        System.out.println(a.name + ": " + a.speak());  // Bruno: Woof!
    }
}`,
        cpp: `#include <iostream>
using namespace std;
class Animal {
public:
    virtual string speak() { return "..."; }    // virtual -> can be overridden
    virtual ~Animal() {}
};
class Dog : public Animal {
public:
    string speak() override { return "Woof!"; }
};
int main() {
    Animal* a = new Dog();
    cout << a->speak() << endl;   // Woof!
    delete a;
}`,
        javascript: `class Animal {
  constructor(name) { this.name = name; }
  speak() { return "..."; }
}
class Dog extends Animal {
  constructor(name) { super(name); }   // must call super before using this
  speak() { return "Woof!"; }
}
console.log(new Dog("Bruno").speak());`
      },
      mistakes: ['Forgetting to call «super().__init__()» / «super(...)», so parent fields are never set.', 'JS: using «this» before calling «super()» in the child constructor.', 'C++: forgetting «virtual», so the parent\'s method runs through a base pointer.', 'Deep inheritance chains that are hard to follow. Prefer composition.'],
      quiz: [
        { q: 'Which relationship suits inheritance?', o: ['Car has an Engine', 'Dog is an Animal', 'Library has Books', 'Student has a Pen'], a: 1, why: 'Inheritance models "is-a"; the others are "has-a" (composition).' }
      ],
      related: ['oop', 'polymorphism', 'interfaces-abstract', 'classes-objects']
    },
    {
      id: 'polymorphism', title: 'Polymorphism (Overloading & Overriding)', cat: 'OOP', level: 'Intermediate',
      aliases: ['method overriding', 'overriding', 'method overloading', 'overloading', 'dynamic dispatch', 'runtime polymorphism', 'compile time polymorphism', 'virtual function', 'virtual functions', 'duck typing', 'function overloading', 'operator overloading'],
      summary: 'Polymorphism means "many forms": the same method call behaves differently depending on the actual type of the object.',
      analogy: 'The command "speak!" makes a dog bark, a cat meow and a person talk. It is the same instruction with a different behaviour.',
      explain: `### Runtime polymorphism (overriding)
A child class **replaces** a parent method with the **same signature**. Which version runs is decided by the object's *actual* type at runtime.

~~~python
shapes = [Circle(2), Square(3)]
for s in shapes:
    print(s.area())     # each shape uses its own area()
~~~

### Compile-time polymorphism (overloading)
Several methods with the **same name but different parameters** in the same class (Java, C++, C#). The compiler picks the right one from the arguments:
~~~java
int add(int a, int b)          { return a + b; }
double add(double a, double b) { return a + b; }
int add(int a, int b, int c)   { return a + b + c; }
~~~
Python and JS have no true overloading; use default or variable arguments instead.

| | Overloading | Overriding |
|---|---|---|
| Where | same class | parent and child |
| Signature | different parameters | same parameters |
| Decided at | compile time | runtime |`,
      code: {
        python: `import math

class Shape:
    def area(self):
        raise NotImplementedError

class Circle(Shape):
    def __init__(self, r): self.r = r
    def area(self): return math.pi * self.r ** 2

class Square(Shape):
    def __init__(self, s): self.s = s
    def area(self): return self.s ** 2

for shape in [Circle(1), Square(2)]:
    print(type(shape).__name__, round(shape.area(), 2))`,
        java: `abstract class Shape { abstract double area(); }

class Circle extends Shape {
    double r; Circle(double r) { this.r = r; }
    @Override double area() { return Math.PI * r * r; }
}
class Square extends Shape {
    double s; Square(double s) { this.s = s; }
    @Override double area() { return s * s; }
}

public class Main {
    public static void main(String[] args) {
        Shape[] shapes = { new Circle(1), new Square(2) };
        for (Shape sh : shapes) System.out.println(sh.area());  // dynamic dispatch
    }
}`,
        cpp: `#include <iostream>
using namespace std;
class Shape { public: virtual double area() const = 0; virtual ~Shape() {} };
class Square : public Shape {
    double s;
public:
    Square(double s) : s(s) {}
    double area() const override { return s * s; }
};
int add(int a, int b) { return a + b; }            // overloads
double add(double a, double b) { return a + b; }
int main() {
    Shape* sh = new Square(3);
    cout << sh->area() << " " << add(1, 2) << " " << add(1.5, 2.5) << endl;
    delete sh;
}`
      },
      mistakes: ['Java: misspelling the overriding method name or parameters, which creates a new method. Use «@Override» to catch this.', 'C++: forgetting «virtual» in the base class.', 'Trying to overload by return type only, which is not allowed.'],
      quiz: [
        { q: 'Method overriding is resolved at…', o: ['Compile time', 'Runtime', 'Link time', 'Never'], a: 1, why: 'The JVM/vtable picks the method from the object\'s actual type at runtime.' }
      ],
      related: ['inheritance', 'interfaces-abstract', 'oop']
    },
    {
      id: 'encapsulation', title: 'Encapsulation & Abstraction', cat: 'OOP', level: 'Intermediate',
      aliases: ['abstraction', 'data hiding', 'information hiding', 'private', 'public', 'protected', 'access modifiers', 'access specifiers', 'getters', 'setters', 'getter setter', 'getters and setters', 'private variable', 'encapsulation vs abstraction'],
      summary: 'Encapsulation bundles data with the methods that use it and hides the internals. Abstraction exposes only what users need.',
      analogy: 'An ATM: you use the buttons (the public interface) to withdraw cash, but you cannot reach into the cash vault (private data) directly. The ATM checks your PIN and balance first.',
      explain: `**Encapsulation**: make fields private and allow changes only through methods that **validate** them.
**Abstraction**: hide *how* something works and show *what* it does («list.sort()» without knowing which algorithm).

| Modifier (Java) | Same class | Same package | Subclass | Everywhere |
|---|---|---|---|---|
| «private» | ✅ | ❌ | ❌ | ❌ |
| *(default)* | ✅ | ✅ | ❌ | ❌ |
| «protected» | ✅ | ✅ | ✅ | ❌ |
| «public» | ✅ | ✅ | ✅ | ✅ |

**Python** has no enforced private. By convention «_name» means internal, and «__name» triggers name-mangling. «@property» gives clean getters and setters.
**JavaScript** has real private fields with «#name».`,
      code: {
        python: `class Temperature:
    def __init__(self, celsius):
        self.celsius = celsius            # goes through the setter below

    @property
    def celsius(self):
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        if value < -273.15:
            raise ValueError("below absolute zero!")
        self._celsius = value

t = Temperature(25)
t.celsius = 30        # validated
# t.celsius = -500    # ValueError`,
        java: `public class Account {
    private double balance;              // nobody outside can touch it directly

    public double getBalance() { return balance; }

    public void withdraw(double amount) {
        if (amount <= 0 || amount > balance)
            throw new IllegalArgumentException("Invalid amount");
        balance -= amount;
    }
}`,
        javascript: `class Account {
  #balance = 0;                    // truly private field
  deposit(x) { if (x > 0) this.#balance += x; }
  get balance() { return this.#balance; }
}
const a = new Account();
a.deposit(100);
console.log(a.balance);   // 100
// a.#balance = 1e9;      // SyntaxError: private field`
      },
      mistakes: ['Writing getters and setters that do no validation at all (just public fields with extra steps).', 'Exposing internal mutable lists directly. Return a copy instead.', 'Confusing abstraction (hide complexity) with encapsulation (hide data and protect invariants).'],
      related: ['oop', 'classes-objects', 'interfaces-abstract']
    },
    {
      id: 'interfaces-abstract', title: 'Interfaces & Abstract Classes', cat: 'OOP', level: 'Intermediate',
      aliases: ['interface', 'interfaces', 'abstract class', 'abstract classes', 'abstract method', 'implements', 'pure virtual function', 'abc python', 'contract', 'abstract'],
      summary: 'Both define what a class must do without fully saying how. An abstract class can share code and state, while an interface is a pure contract.',
      analogy: 'An interface is a job description ("must be able to drive and navigate"). An abstract class is a half-built template: some parts are done, and the rest must be finished by whoever extends it.',
      explain: `| | Abstract class | Interface |
|---|---|---|
| Can have fields/state | ✅ | ❌ (only constants) |
| Can have implemented methods | ✅ | ✅ («default» methods, Java 8+) |
| Constructor | ✅ | ❌ |
| A class can extend/implement… | **one** | **many** |
| Relationship | "is-a" with shared base code | "can-do" capability |

**Rule of thumb**
- Use an **interface** for a capability many unrelated classes share: «Comparable», «Runnable», «Printable».
- Use an **abstract class** when related classes share code or state: «Shape» with a common «color» field.

You **cannot create objects** of an abstract class or an interface directly.`,
      code: {
        java: `interface Payable {                     // a contract
    double pay(double amount);
}

abstract class Employee implements Payable {
    protected String name;
    Employee(String name) { this.name = name; }
    abstract double salary();            // subclasses must implement
    public double pay(double bonus) { return salary() + bonus; }
}

class Intern extends Employee {
    Intern(String n) { super(n); }
    double salary() { return 15000; }
}

public class Main {
    public static void main(String[] args) {
        Payable p = new Intern("Kiran");
        System.out.println(p.pay(1000));   // 16000.0
    }
}`,
        python: `from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self): ...

class Rect(Shape):
    def __init__(self, w, h): self.w, self.h = w, h
    def area(self): return self.w * self.h

print(Rect(2, 3).area())   # 6
# Shape()                  # TypeError: can't instantiate abstract class`,
        cpp: `class Shape {
public:
    virtual double area() const = 0;   // pure virtual -> abstract class
    virtual ~Shape() = default;
};
class Rect : public Shape {
    double w, h;
public:
    Rect(double w, double h) : w(w), h(h) {}
    double area() const override { return w * h; }
};`
      },
      mistakes: ['Trying to «new» an abstract class or interface.', 'Forgetting to implement every abstract/interface method, which is a compile error.', 'Java: a class can only «extends» one class but can «implements» many interfaces.'],
      quiz: [
        { q: 'How many interfaces can a Java class implement?', o: ['Only one', 'Two', 'Many', 'None'], a: 2, why: 'Java allows implementing multiple interfaces but extending only one class.' }
      ],
      related: ['inheritance', 'polymorphism', 'encapsulation']
    },
    {
      id: 'static', title: 'The static Keyword', cat: 'Java', level: 'Intermediate',
      aliases: ['static', 'static keyword', 'static method', 'static methods', 'static variable', 'static variables', 'class method', 'staticmethod', 'classmethod', 'instance method', 'static context', 'public static void main', 'main method', 'why is main static'],
      summary: 'Static members belong to the class itself, not to any single object. They are shared by all instances and can be used without creating an object.',
      explain: `| | Instance member | Static member |
|---|---|---|
| Belongs to | each object | the class |
| Access | «obj.method()» | «ClassName.method()» |
| Can use «this» / instance fields? | ✅ | ❌ |
| Copies | one per object | exactly one |

### Why is «main» static?
The JVM needs to call «main» **before any object exists**, so «main» must belong to the class.

### The classic error
~~~java bad
public class Main {
    int count = 0;
    void greet() { System.out.println("hi"); }
    public static void main(String[] args) {
        greet();          // error: non-static method greet() cannot be referenced from a static context
    }
}
~~~
~~~java good
public class Main {
    static void greet() { System.out.println("hi"); }   // make it static…
    public static void main(String[] args) {
        greet();
        // …or create an object: new Main().someInstanceMethod();
    }
}
~~~`,
      code: {
        java: `class Counter {
    static int created = 0;          // shared by all Counter objects
    int value = 0;                   // each object has its own
    Counter() { created++; }
    static int howMany() { return created; }
}
public class Main {
    public static void main(String[] args) {
        new Counter(); new Counter();
        System.out.println(Counter.howMany());   // 2
    }
}`,
        python: `class MathUtil:
    count = 0                       # class attribute (like static)

    @staticmethod
    def square(x):                  # no self / cls needed
        return x * x

    @classmethod
    def make(cls):                  # receives the class itself
        cls.count += 1
        return cls()

print(MathUtil.square(5))`,
        cpp: `#include <iostream>
class Counter {
public:
    static int created;                 // declaration
    Counter() { created++; }
};
int Counter::created = 0;               // definition (needed outside the class)
int main() { Counter a, b; std::cout << Counter::created; }  // 2`
      },
      mistakes: ['Calling an instance method from «static main» without creating an object.', 'Making everything static to "fix" errors, which turns OOP code into globals.', 'C++: forgetting to define the static member outside the class (linker error).'],
      related: ['classes-objects', 'oop']
    }
  ]);
})();
