/* CodeMentor KB — Python errors.
   Fields: re = patterns ($1.. captures are substituted into text), what, causes, fix (markdown), concept, tips, related. */
(function () {
  'use strict';
  window.CM.kb.add('errors', [
    {
      id: 'py-nameerror', lang: 'python', title: 'NameError: name is not defined',
      re: [/NameError:\s*name\s+'([^']+)'\s+is not defined/i, /NameError:\s*(?:global\s+)?name\s+'?([\w]+)'?/i],
      kw: ['nameerror', 'is not defined', 'name not defined'], dflt: ['the name'], suggestName: true,
      what: 'Python reached the name «$1», but nothing with that exact name exists at that point in the program.',
      causes: ['A **typo** or wrong capitalisation («Print» vs «print», «total» vs «Total»).', 'Using a variable **before** it is assigned, or the assignment is inside an «if» that did not run.', 'The variable was created **inside a function** and you are using it outside (scope).', 'You forgot to **import** a module (e.g. «math», «random»).', 'You meant a **string** but forgot the quotes: «print(hello)» instead of «print("hello")».'],
      fix: `**1. Check the spelling and case**
~~~python bad
mesage = "Hi"
print(message)
~~~
~~~python good
message = "Hi"
print(message)
~~~
**2. Define before use, and import what you need**
~~~python good
import math
radius = 3
print(math.pi * radius ** 2)
~~~
**3. Return values out of functions** instead of expecting their local variables to exist outside.`,
      concept: 'Python looks names up in the order **L**ocal → **E**nclosing → **G**lobal → **B**uilt-in (LEGB). If none of those scopes has the name *at the moment the line runs*, you get a NameError. Python runs top to bottom, so order matters.',
      tips: ['Use an editor with autocomplete to avoid typos.', 'Unquoted words are always treated as variable names.'],
      related: ['scope', 'variables', 'functions']
    },
    {
      id: 'py-syntax-colon', lang: 'python', title: "SyntaxError: expected ':'",
      re: [/SyntaxError:\s*expected\s*':'/i],
      kw: ['expected colon', "expected ':'"],
      what: 'A block statement (if, elif, else, for, while, def, class, try, except, with) must end with a colon «:».',
      causes: ['Forgot the «:» at the end of «if», «for», «while», «def» or «class».', 'Wrote «else if» instead of «elif».', 'Used «=» instead of «==» inside a condition (may also show "invalid syntax").'],
      fix: `~~~python bad
if marks >= 40
    print("Pass")
~~~
~~~python good
if marks >= 40:
    print("Pass")
~~~
Every line that **starts a block** ends with «:», and the block's body is indented underneath it.`,
      concept: 'Python uses the colon plus indentation (instead of «{ }») to mark where a block begins. The colon says "a block follows".',
      tips: ['After typing «:» and Enter, a good editor auto-indents the next line.'],
      related: ['conditionals', 'loops', 'functions']
    },
    {
      id: 'py-syntax-invalid', lang: 'python', title: 'SyntaxError: invalid syntax',
      re: [/SyntaxError:\s*invalid syntax(?:\.\s*(Perhaps you forgot a comma\?|Maybe you meant '==' or ':=' instead of '='\?))?/i],
      kw: ['invalid syntax', 'syntaxerror'],
      what: 'Python could not understand the structure of a line. The «^» marker shows where it got confused, but the real mistake is often **on the line before**.',
      causes: ['Missing «:» after «if/for/while/def/class».', '«=» used instead of «==» in a condition.', 'Missing comma between items in a list, dict or function call.', 'Unclosed bracket or quote on the **previous** line.', 'Python 2 syntax, e.g. «print "hi"» instead of «print("hi")».', 'Using a keyword as a variable name («class = 5», «for = 1»).', 'Using «&&», «||», «!», «++» from C/Java/JS. In Python write «and», «or», «not», «+= 1».'],
      fix: `Look at the marked line **and the one above it**.
~~~python bad
if x = 10
    print "ten"
count++
~~~
~~~python good
if x == 10:
    print("ten")
count += 1
~~~`,
      concept: 'Before running anything, Python parses the whole file into a syntax tree. If the grammar is broken anywhere, nothing runs. That is why syntax errors appear immediately.',
      tips: ['Paste your code here and I will run a syntax check that points at the exact line.'],
      related: ['debugging', 'conditionals']
    },
    {
      id: 'py-unterminated-string', lang: 'python', title: 'SyntaxError: unterminated string literal',
      re: [/SyntaxError:\s*(unterminated (?:triple-quoted )?string literal|EOL while scanning string literal|EOF while scanning triple-quoted string literal)/i],
      kw: ['unterminated string', 'eol while scanning'],
      what: 'A string was opened with a quote but never closed on that line.',
      causes: ['Missing closing quote: «print("Hello)».', 'Mixing quote types: «"text\'».', 'An apostrophe inside a single-quoted string: «\'it\'s\'».', 'A Windows path ending with a backslash: «"C:\\folder\\"» (the «\\"» escapes the quote).'],
      fix: `~~~python bad
msg = 'It's raining'
path = "C:\\new\\"
~~~
~~~python good
msg = "It's raining"          # use the other quote type
path = r"C:\\new\\folder"      # raw string for paths
~~~`,
      concept: 'A string literal starts and ends with the **same** quote character. A backslash escapes the next character, so «\\"» is a quote *inside* the string, not the end of it.',
      tips: ['Use triple quotes «"""…"""» for multi-line text.'],
      related: ['strings']
    },
    {
      id: 'py-never-closed', lang: 'python', title: "SyntaxError: '(' was never closed",
      re: [/SyntaxError:\s*'([(\[{])' was never closed/i, /SyntaxError:\s*unexpected EOF while parsing/i, /SyntaxError:\s*unmatched '([)\]}])'/i, /SyntaxError:\s*closing parenthesis '(.)' does not match/i],
      kw: ['was never closed', 'unexpected eof', 'unmatched'], dflt: ['bracket'],
      what: 'Brackets are unbalanced: an opening «$1» has no matching close (or there is an extra close).',
      causes: ['Missing «)» at the end of a «print(...)» or function call, often with nested calls like «print(len(x)».', 'Missing «]» or «}» in a list or dict that spans several lines.', 'An extra closing bracket.'],
      fix: `~~~python bad
print("Total:", sum(marks)
~~~
~~~python good
print("Total:", sum(marks))
~~~
Count them: every «(» needs a «)», every «[» a «]», every «{» a «}». Editors highlight the matching bracket when you place the cursor next to one.`,
      concept: 'Inside brackets Python lets an expression span several lines, so a missing «)» can make the error show up lines later, or at the end of the file.',
      related: ['debugging']
    },
    {
      id: 'py-indentation', lang: 'python', title: 'IndentationError',
      re: [/IndentationError:\s*(expected an indented block(?: after '?(\w+)'? statement on line (\d+))?)/i, /IndentationError:\s*(unexpected indent)/i, /IndentationError:\s*(unindent does not match any outer indentation level)/i, /TabError:\s*(inconsistent use of tabs and spaces in indentation)/i],
      kw: ['indentationerror', 'expected an indented block', 'unexpected indent', 'unindent does not match', 'taberror', 'tabs and spaces'], dflt: ['an indentation problem'],
      what: 'Python found $1. In Python, **indentation is part of the syntax**: it decides which lines belong to which block.',
      causes: ['A block («if», «for», «def», …) has no indented body under it.', 'A line is indented when it should not be (unexpected indent).', 'Lines in the same block use different amounts of spaces.', 'Mixing **tabs and spaces**, which often happens when copying code from the web.'],
      fix: `~~~python bad
def greet(name):
print("Hi", name)        # body not indented
    x = 5                # unexpected indent
~~~
~~~python good
def greet(name):
    print("Hi", name)    # 4 spaces

x = 5
~~~
If a block is intentionally empty, write «pass». In VS Code use **"Convert Indentation to Spaces"** to fix tab/space mixing.`,
      concept: 'Where other languages use «{ }», Python uses **consistent indentation** (4 spaces is the standard) to group statements into blocks.',
      tips: ['Configure your editor to insert 4 spaces when you press Tab.'],
      related: ['conditionals', 'loops', 'functions']
    },
    {
      id: 'py-concat-str-int', lang: 'python', title: 'TypeError: can only concatenate str (not "int") to str',
      re: [/TypeError:\s*can only concatenate (str|list|tuple) \(not "(\w+)"\) to (?:str|list|tuple)/i, /TypeError:\s*unsupported operand type\(s\) for ([+\-*\/%]|\*\*|\/\/):\s*'(\w+)' and '(\w+)'/i, /TypeError:\s*must be str, not (\w+)/i],
      kw: ['can only concatenate str', 'unsupported operand type', 'must be str, not'], dflt: ['str', 'int'],
      what: 'You combined two values whose types do not work together with that operator, for example adding text and a number.',
      causes: ['Joining a string with a number: «"Age: " + 20».', 'Doing math on «input()» results, which are **always strings**.', 'A variable is «None» because a function did not return anything.', 'Adding a list and a non-list.'],
      fix: `~~~python bad
age = input("Age: ")
print("Next year: " + age + 1)
~~~
~~~python good
age = int(input("Age: "))           # convert input to a number
print("Next year:", age + 1)        # print() with commas handles types
print(f"Next year: {age + 1}")      # or an f-string
print("Next year: " + str(age + 1)) # or convert the number to str
~~~`,
      concept: 'Python is **strongly typed**: it never silently converts between text and numbers (unlike JavaScript). «"5" + 1» is ambiguous ("51" or 6?), so Python refuses and makes you choose with «int()» or «str()».',
      tips: ['f-strings («f"{x}"») are the easiest way to mix text and values.'],
      related: ['type-conversion', 'strings', 'variables']
    },
    {
      id: 'py-not-callable', lang: 'python', title: "TypeError: 'X' object is not callable",
      re: [/TypeError:\s*'(\w+)' object is not callable/i],
      kw: ['is not callable', 'object is not callable'], dflt: ['value'],
      what: 'You used «( )» to call something that is a **$1**, not a function.',
      causes: ['You **overwrote a built-in** with a variable: «list = [1,2]», «str = "a"», «sum = 0», «max = 5», then later called «list(...)», «sum(...)» and so on.', 'Missing operator: «2(3 + 4)» should be «2 * (3 + 4)».', 'Calling a property or attribute as if it were a method.', 'Using «()» instead of «[]» to index: «mylist(0)».'],
      fix: `~~~python bad
sum = 0
for x in nums:
    sum += x
print(sum(nums))     # 'int' object is not callable
~~~
~~~python good
total = 0            # don't shadow the built-in name
for x in nums:
    total += x
print(sum(nums))
~~~`,
      concept: 'In Python, functions are objects bound to names. If you assign something else to the name «sum», the built-in function is hidden for the rest of that scope.',
      tips: ['Avoid naming variables «list», «dict», «str», «sum», «max», «min», «input» or «type».'],
      related: ['functions', 'variables', 'scope']
    },
    {
      id: 'py-not-subscriptable', lang: 'python', title: "TypeError: 'X' object is not subscriptable",
      re: [/TypeError:\s*'(\w+)' object is not subscriptable/i],
      kw: ['not subscriptable', 'nonetype object is not subscriptable'], dflt: ['value'],
      what: 'You used «[ ]» indexing on a **$1**, which does not support indexing.',
      causes: ['The value is «None»: often a function that **forgot to return**, or a method like «list.sort()» that returns None.', 'Indexing a number: «n = 1234; n[0]». Convert to a string first: «str(n)[0]».', 'Using «[]» on a function instead of calling it with «()».'],
      fix: `~~~python bad
nums = [3, 1, 2]
nums = nums.sort()     # sort() returns None!
print(nums[0])
~~~
~~~python good
nums = [3, 1, 2]
nums.sort()            # sorts in place
print(nums[0])         # or: nums = sorted(nums)
~~~`,
      concept: 'Only containers (str, list, tuple, dict, …) implement «__getitem__», which is what «[ ]» calls. In-place methods such as «sort()», «append()» and «reverse()» return «None» to signal they changed the original.',
      related: ['arrays-lists', 'functions', 'python-mutability']
    },
    {
      id: 'py-args', lang: 'python', title: 'TypeError: wrong number of arguments',
      re: [/TypeError:\s*(\w+)\(\) missing (\d+) required positional argument/i, /TypeError:\s*(\w+)\(\) takes (\d+) positional arguments? but (\d+) (?:were|was) given/i, /TypeError:\s*(\w+)\(\) got an unexpected keyword argument '(\w+)'/i],
      kw: ['missing required positional argument', 'positional arguments but', 'unexpected keyword argument'], dflt: ['the function'],
      what: 'The call to «$1()» passes a different number (or names) of arguments than its definition expects.',
      causes: ['Calling with too few or too many arguments.', 'A **method** inside a class is missing the «self» parameter, so Python passes the object automatically and you get "takes 0 positional arguments but 1 was given".', 'Calling an instance method on the class itself («Student.greet()» instead of «s.greet()»).'],
      fix: `~~~python bad
class Dog:
    def bark():            # missing self
        print("Woof")
Dog().bark()
~~~
~~~python good
class Dog:
    def bark(self):
        print("Woof")
Dog().bark()
~~~
Compare the call with the «def» line: same order, same count (unless a parameter has a default value).`,
      concept: 'When you call «obj.method(a)», Python actually runs «Class.method(obj, a)». The object is passed as the first argument, which is why methods need «self».',
      related: ['functions', 'classes-objects']
    },
    {
      id: 'py-not-iterable', lang: 'python', title: "TypeError: 'X' object is not iterable",
      re: [/TypeError:\s*'(\w+)' object is not iterable/i, /TypeError:\s*cannot unpack non-iterable (\w+) object/i],
      kw: ['not iterable', 'cannot unpack non-iterable'], dflt: ['value'],
      what: 'A «for» loop (or unpacking) received a **$1**, which cannot be looped over.',
      causes: ['Looping over a number: «for i in 10» instead of «for i in range(10)».', 'Looping over «None», often a function without a return.', 'Unpacking a single value into two variables: «a, b = 5».'],
      fix: `~~~python bad
n = 5
for i in n:
    print(i)
~~~
~~~python good
n = 5
for i in range(n):
    print(i)
~~~`,
      concept: 'An **iterable** is anything that can hand out items one at a time (list, str, range, dict, file…). Plain numbers are not iterable; «range(n)» turns a count into an iterable.',
      related: ['loops', 'arrays-lists']
    },
    {
      id: 'py-indices-type', lang: 'python', title: 'TypeError: list indices must be integers or slices',
      re: [/TypeError:\s*(list|string|tuple) indices must be integers(?: or slices)?, not (\w+)/i],
      kw: ['indices must be integers'], dflt: ['list', 'str'],
      what: 'You indexed a $1 with a **$2**. Indexes must be whole numbers.',
      causes: ['Using an input string directly: «arr[input()]».', 'A float from «/» division: «arr[len(arr)/2]».', 'Looping «for x in arr» and then writing «arr[x]» (x is already the item!).', 'Treating a list like a dict: «students["asha"]».'],
      fix: `~~~python bad
mid = arr[len(arr) / 2]      # / gives a float
~~~
~~~python good
mid = arr[len(arr) // 2]     # // gives an int
~~~`,
      concept: 'Lists are accessed by **position** (0, 1, 2…). If you want to look things up by name, use a **dict**.',
      related: ['arrays-lists', 'hash-map', 'operators']
    },
    {
      id: 'py-indexerror', lang: 'python', title: 'IndexError: list index out of range',
      re: [/IndexError:\s*(list|string|tuple|pop from empty list|pop index) ?(?:index )?out of range/i, /IndexError:\s*(pop from empty list)/i],
      kw: ['index out of range', 'indexerror', 'pop from empty list'], dflt: ['list'],
      what: 'You asked for a position that does not exist in the $1. For a list of length n, valid indexes are «0» to «n - 1».',
      causes: ['**Off-by-one** loop: «range(len(arr) + 1)» or «while i <= len(arr)».', 'Accessing «arr[i + 1]» on the last iteration.', 'The list is **empty** (e.g. input was not read, or a filter removed everything).', 'Assuming «arr[len(arr)]» is the last element (it is «arr[-1]»).'],
      fix: `~~~python bad
nums = [10, 20, 30]
for i in range(len(nums) + 1):
    print(nums[i])         # i = 3 does not exist
~~~
~~~python good
nums = [10, 20, 30]
for n in nums:             # simplest: loop over items
    print(n)
for i in range(len(nums) - 1):   # if you compare nums[i] and nums[i+1]
    print(nums[i], nums[i + 1])
~~~
Guard against empty lists: «if nums: print(nums[0])».`,
      concept: '**Zero-based indexing**: the first element is at offset 0 from the start, so the last is at «len - 1». Python checks every access and raises IndexError instead of reading random memory like C does.',
      tips: ['Print «len(list)» and the index just before the failing line.'],
      related: ['arrays-lists', 'loops']
    },
    {
      id: 'py-keyerror', lang: 'python', title: 'KeyError',
      re: [/KeyError:\s*(.+)$/im],
      kw: ['keyerror'], dflt: ['the key'],
      what: 'The dictionary has no key «$1».',
      causes: ['Typo or different case in the key: «"Name"» vs «"name"».', 'The key is a different **type**: «1» vs «"1"».', 'The key was never added (e.g. counting before initialising).', 'Using a list index on a dict, or accessing JSON fields that may be missing.'],
      fix: `~~~python bad
counts = {}
for w in words:
    counts[w] += 1          # KeyError the first time
~~~
~~~python good
counts = {}
for w in words:
    counts[w] = counts.get(w, 0) + 1   # default 0

if "email" in user:                     # check before access
    print(user["email"])
~~~
Also try «collections.defaultdict(int)» or «Counter».`,
      concept: 'A dict lookup hashes the key and checks that exact key. There is no "close enough". «d[key]» raises if it is missing, while «d.get(key, default)» returns the default.',
      related: ['hash-map']
    },
    {
      id: 'py-attributeerror', lang: 'python', title: "AttributeError: object has no attribute",
      re: [/AttributeError:\s*'(\w+)' object has no attribute '(\w+)'/i, /AttributeError:\s*module '([\w.]+)' has no attribute '(\w+)'/i, /AttributeError:\s*type object '(\w+)' has no attribute '(\w+)'/i],
      kw: ['has no attribute', 'attributeerror', 'nonetype object has no attribute'], dflt: ['object', 'attribute'], suggestAttr: true,
      what: 'A «$1» value does not have anything called «$2».',
      causes: ['The value is «None» (type «NoneType») because a function or method returned nothing.', 'Typo in the method name or wrong case: «.Append()», «.lenght».', 'Using a method from another type or language: «list.push()» (JS) instead of «list.append()», or «str.length()» instead of «len(s)».', 'Your file is named like a module (e.g. «random.py», «math.py»), which shadows the real one.', 'Forgot to set «self.x = ...» in «__init__».'],
      fix: `~~~python bad
nums = [1, 2]
nums.push(3)
name = "asha"
print(name.length())
~~~
~~~python good
nums = [1, 2]
nums.append(3)
name = "asha"
print(len(name))
~~~
Use «dir(value)» to list what an object really has.`,
      concept: 'Attributes are looked up on the object, then on its class and parent classes. If no level has that name, you get AttributeError. Each type has its own set of methods, and they differ between languages.',
      related: ['classes-objects', 'strings', 'arrays-lists']
    },
    {
      id: 'py-valueerror-int', lang: 'python', title: 'ValueError: invalid literal for int()',
      re: [/ValueError:\s*invalid literal for int\(\) with base \d+:\s*'(.*)'/i, /ValueError:\s*could not convert string to float:\s*'(.*)'/i],
      kw: ['invalid literal for int', 'could not convert string to float'], dflt: ['the text'],
      what: 'You asked Python to turn «\'$1\'» into a number, but that text is not a valid number.',
      causes: ['Input contains a decimal point: «int("3.5")».', 'Empty input (the user just pressed Enter): «int("")».', 'Extra characters: units, commas or letters («"10kg"», «"1,000"»).', 'Reading a whole line containing several numbers: «int("4 5 6")».'],
      fix: `~~~python good
text = input("Enter a number: ").strip()
try:
    n = int(text)
except ValueError:
    print("Please enter a whole number")

x = int(float("3.5"))                   # decimal text -> int
a, b = map(int, input().split())        # "4 5" -> 4, 5
~~~`,
      concept: 'Conversion functions are strict: «int()» accepts only optional whitespace, a sign and digits. Validating input is your program\'s job.',
      related: ['type-conversion', 'exceptions']
    },
    {
      id: 'py-zerodiv', lang: 'python', title: 'ZeroDivisionError: division by zero',
      re: [/ZeroDivisionError:\s*(.*)$/im],
      kw: ['zerodivisionerror', 'division by zero', 'modulo by zero'],
      what: 'Something was divided by zero (with «/», «//» or «%»), which is mathematically undefined.',
      causes: ['Averaging an empty list: «sum(x) / len(x)» when «len(x)» is 0.', 'A counter that was never incremented.', 'User input of 0.'],
      fix: `~~~python good
def average(nums):
    if not nums:              # guard the edge case
        return 0
    return sum(nums) / len(nums)
~~~`,
      concept: 'Always think about **edge cases**: empty inputs, zero and negative numbers. Many crashes come from inputs nobody tested.',
      related: ['exceptions', 'operators', 'debugging']
    },
    {
      id: 'py-modulenotfound', lang: 'python', title: "ModuleNotFoundError: No module named",
      re: [/ModuleNotFoundError:\s*No module named '([\w.]+)'/i, /ImportError:\s*cannot import name '(\w+)' from '([\w.]+)'/i, /ImportError:\s*No module named ([\w.]+)/i],
      kw: ['modulenotfounderror', 'no module named', 'importerror', 'cannot import name'], dflt: ['the module'],
      what: 'Python cannot find the module «$1» in the environment that is running your code.',
      causes: ['The package is **not installed**: run «pip install $1».', 'It is installed for a **different Python** (multiple versions, or a virtual environment).', 'The pip package name differs from the import name: «import cv2» → «pip install opencv-python», «import sklearn» → «pip install scikit-learn», «import PIL» → «pip install pillow».', 'Typo in the module name, or your own file shadows it (e.g. you named your file «numpy.py»).'],
      fix: `Install it **using the same Python that runs your code**:
~~~bash
python -m pip install $1
# Windows launcher alternative:
py -m pip install $1
~~~
In VS Code, check the interpreter shown in the bottom-right corner matches the one you installed into.`,
      concept: '«import» searches the folders listed in «sys.path» (your script\'s folder, then site-packages of the *current* interpreter). Each Python installation has its own site-packages.',
      tips: ['Print «import sys; print(sys.executable)» to see which Python is running.'],
      related: ['debugging']
    },
    {
      id: 'py-recursion', lang: 'python', title: 'RecursionError: maximum recursion depth exceeded',
      re: [/RecursionError:\s*maximum recursion depth exceeded/i],
      kw: ['recursionerror', 'maximum recursion depth'],
      what: 'A function kept calling itself about 1000 times without stopping, so Python halted it to protect the call stack.',
      causes: ['**Missing base case.**', 'The base case is never reached because the argument does not move toward it («f(n)» or «f(n + 1)» instead of «f(n - 1)»).', 'The input really is very deep (e.g. 10⁵ levels).', 'A method or property that accidentally calls itself (e.g. a setter assigning to its own property).'],
      fix: `~~~python bad
def countdown(n):
    print(n)
    countdown(n - 1)        # never stops
~~~
~~~python good
def countdown(n):
    if n < 0:               # base case
        return
    print(n)
    countdown(n - 1)
~~~
For genuinely deep inputs, rewrite it as a loop.`,
      concept: 'Every recursive call adds a frame to the call stack. Without a base case that is actually reached, the stack grows until the limit.',
      related: ['recursion', 'functions']
    },
    {
      id: 'py-unbound', lang: 'python', title: 'UnboundLocalError: local variable referenced before assignment',
      re: [/UnboundLocalError:\s*(?:local variable|cannot access local variable) '(\w+)'/i],
      kw: ['unboundlocalerror', 'referenced before assignment'], dflt: ['the variable'],
      what: '«$1» is assigned somewhere inside this function, so Python treats it as **local** everywhere in the function, but you read it before that assignment ran.',
      causes: ['Modifying a **global** variable inside a function (e.g. «count += 1») without declaring «global count».', 'The variable is only set inside an «if» branch that did not run.'],
      fix: `~~~python bad
score = 0
def add_point():
    score += 1
~~~
~~~python good
score = 0
def add_point(score):
    return score + 1         # best: pass in, return out
score = add_point(score)

# or, if you really need it:
def add_point_global():
    global score
    score += 1
~~~`,
      concept: 'Python decides scope at **compile time**: any assignment to a name inside a function makes that name local for the *whole* function body.',
      related: ['scope', 'functions']
    },
    {
      id: 'py-filenotfound', lang: 'python', title: 'FileNotFoundError: No such file or directory',
      re: [/FileNotFoundError:\s*\[Errno 2\] No such file or directory:\s*'(.+?)'/i],
      kw: ['filenotfounderror', 'no such file or directory'], dflt: ['the file'],
      what: 'Python cannot find «$1» at the path you gave.',
      causes: ['A relative path is resolved from the **current working directory**, which may not be your script\'s folder (common in VS Code).', 'A typo or a missing extension («data» vs «data.txt»; Windows hides extensions by default).', 'Backslashes in Windows paths: «"C:\\new\\data.txt"» contains «\\n» (a newline).'],
      fix: `~~~python good
from pathlib import Path

base = Path(__file__).parent            # folder of this script
path = base / "data.txt"
print("Looking for:", path.resolve())
with open(path, encoding="utf-8") as f:
    print(f.read())
~~~
For Windows paths use raw strings «r"C:\\new\\data.txt"» or forward slashes «"C:/new/data.txt"».`,
      concept: 'Relative paths are relative to where the program was **launched**, not where the «.py» file lives.',
      related: ['debugging']
    },
    {
      id: 'py-str-assign', lang: 'python', title: "TypeError: 'str' object does not support item assignment",
      re: [/TypeError:\s*'(str|tuple)' object does not support item assignment/i],
      kw: ['does not support item assignment'], dflt: ['str'],
      what: 'You tried to change one element of a «$1», but «$1» is **immutable**.',
      causes: ['Trying to edit a character in place: «s[0] = "H"».', 'Trying to change an element of a tuple.'],
      fix: `~~~python bad
s = "hello"
s[0] = "H"
~~~
~~~python good
s = "hello"
s = "H" + s[1:]              # build a new string
chars = list(s)              # or convert to a list, edit, join
chars[0] = "J"
s = "".join(chars)
~~~`,
      concept: 'Immutable objects can never change after creation. Operations that look like edits actually create a **new** object.',
      related: ['python-mutability', 'strings']
    },
    {
      id: 'py-eof', lang: 'python', title: 'EOFError: EOF when reading a line',
      re: [/EOFError:\s*EOF when reading a line/i],
      kw: ['eoferror', 'eof when reading a line'],
      what: '«input()» was called but there was no more input to read.',
      causes: ['The program asks for input but the runner/online judge did not provide it (in the Playground, type it into the **Input** box).', 'More «input()» calls than lines of input provided.'],
      fix: `Provide every input line the program expects, one per line. To read until input ends:
~~~python good
import sys
for line in sys.stdin:
    print(line.strip())
~~~`,
      concept: 'EOF means "end of file". Standard input is treated like a file, and once it is exhausted, «input()» has nothing left to return.',
      related: ['type-conversion']
    },
    {
      id: 'py-dict-changed', lang: 'python', title: 'RuntimeError: dictionary changed size during iteration',
      re: [/RuntimeError:\s*(dictionary|set) changed size during iteration/i],
      kw: ['changed size during iteration'], dflt: ['dictionary'],
      what: 'You added or removed keys from a $1 while looping over it.',
      causes: ['Deleting items inside «for k in d:».'],
      fix: `~~~python good
for k in list(d):          # loop over a snapshot of the keys
    if d[k] == 0:
        del d[k]

d = {k: v for k, v in d.items() if v != 0}   # or build a new dict
~~~`,
      concept: 'Iterators assume the collection is not restructured underneath them. Loop over a copy, or build a new collection.',
      related: ['hash-map', 'loops']
    }
  ]);
})();
