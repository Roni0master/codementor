/* CodeMentor KB — JavaScript / TypeScript / Node / React errors */
(function () {
  'use strict';
  window.CM.kb.add('errors', [
    {
      id: 'js-referenceerror', lang: 'javascript', title: 'ReferenceError: x is not defined',
      re: [/ReferenceError:\s*([\w$]+) is not defined/i, /ReferenceError:\s*Can't find variable:\s*([\w$]+)/i],
      kw: ['referenceerror', 'is not defined'], dflt: ['the variable'], suggestName: true,
      what: 'JavaScript cannot find any variable or function called «$1» in the current scope.',
      causes: ['A **typo** or wrong case: «Console.log», «documnet», «myvar» vs «myVar».', 'The variable is declared with «let»/«const» **inside a block or function** and used outside it.', 'A script or library is not loaded yet (wrong «<script>» order or a missing import).', 'Node.js code running in the browser (e.g. «require» or «process» in a browser, or «document» or «window» in Node).', 'Forgot quotes around a string.'],
      fix: `~~~javascript bad
if (true) {
  const total = 10;
}
console.log(total);
~~~
~~~javascript good
let total;
if (true) {
  total = 10;
}
console.log(total);
~~~
Check the spelling exactly (JS is case-sensitive) and make sure scripts load in the right order.`,
      concept: '«let» and «const» are **block-scoped**: they only exist between the «{ }» where they are declared. A name that is not in the current scope chain gives a ReferenceError.',
      related: ['scope', 'js-hoisting']
    },
    {
      id: 'js-cannot-read', lang: 'javascript', title: "TypeError: Cannot read properties of undefined / null",
      re: [/TypeError:\s*Cannot read propert(?:y|ies) of (undefined|null) \(reading '([^']+)'\)/i, /TypeError:\s*Cannot read property '([^']+)' of (undefined|null)/i, /TypeError:\s*(undefined|null) is not an object \(evaluating '([^']+)'\)/i, /TypeError:\s*Cannot set propert(?:y|ies) of (undefined|null)(?: \(setting '([^']+)'\))?/i],
      kw: ['cannot read properties of undefined', 'cannot read property', 'of null', 'cannot set properties of null', 'is not an object'], dflt: ['undefined', 'a property'],
      what: 'You tried to access «.$2» on something that is «$1». There is no object there to read from.',
      causes: ['A DOM lookup returned «null»: wrong id/selector, or the **script runs before the HTML element exists**.', 'Data has not arrived yet (async fetch) when you render it.', 'An array index past the end returns «undefined»: «arr[arr.length].name».', 'A function forgot to «return» a value.', 'A nested property is missing in the JSON: «user.address.city» when «address» is absent.'],
      fix: `~~~javascript bad
const btn = document.getElementById("submit-btn"); // null if the id is wrong or not loaded yet
btn.addEventListener("click", go);
~~~
~~~javascript good
// 1) load the script after the HTML: <script src="app.js" defer></script>
const btn = document.getElementById("submit-btn");
if (btn) btn.addEventListener("click", go);

// 2) optional chaining for data that may be missing
const city = user?.address?.city ?? "Unknown";
~~~
**Debug it:** «console.log» the object just before the failing line to see what it really is.`,
      concept: '«undefined» means "no value was assigned" and «null» means "intentionally empty". Neither is an object, so they have no properties. This is the most common JS runtime error, and the fix is always to find **why** the value is missing.',
      tips: ['Optional chaining «?.» and nullish coalescing «??» help with values that may legitimately be missing.'],
      related: ['dom', 'js-async', 'debugging']
    },
    {
      id: 'js-not-function', lang: 'javascript', title: 'TypeError: x is not a function',
      re: [/TypeError:\s*([\w$.\[\]()'"]+) is not a function/i],
      kw: ['is not a function'], dflt: ['the value'], suggestAttr: true,
      what: 'You called «$1(...)», but at that moment it holds something that is not a function (often «undefined»).',
      causes: ['A **typo in a method name**: «getElementByID», «addEventListner», «.lenght()», «.toUppercase()».', 'Calling an array method on a non-array: «data.map» when «data» is an object or a string (e.g. un-parsed JSON).', 'A variable with the same name overwrote the function.', 'Wrong import/export (default vs named), so the import is «undefined».', 'Calling a property: «arr.length()» (length is not a function).'],
      fix: `~~~javascript bad
document.getElementByID("title");
const res = await fetch(url);
res.map(x => x.name);
~~~
~~~javascript good
document.getElementById("title");
const res = await fetch(url);
const data = await res.json();     // parse first
if (Array.isArray(data)) data.map(x => x.name);
~~~`,
      concept: 'In JS, functions are values stored in variables and properties. Calling «x()» works only if «x» currently holds a function. «console.log(typeof x)» tells you what it really is.',
      related: ['functions', 'dom', 'js-async']
    },
    {
      id: 'js-const-assign', lang: 'javascript', title: 'TypeError: Assignment to constant variable',
      re: [/TypeError:\s*Assignment to constant variable/i, /TypeError:\s*invalid assignment to const '?([\w$]+)'?/i],
      kw: ['assignment to constant variable', 'invalid assignment to const'],
      what: 'You declared a variable with «const» and later tried to reassign it.',
      causes: ['Using «const» for a counter, accumulator or loop variable («for (const i = 0; ...; i++)»).', 'Reassigning an object instead of changing its properties.'],
      fix: `~~~javascript bad
const total = 0;
for (const n of nums) total += n;
~~~
~~~javascript good
let total = 0;
for (const n of nums) total += n;   // const is fine in for...of (new binding each loop)
~~~`,
      concept: '«const» means the **binding** cannot be reassigned. Objects and arrays declared with «const» can still be mutated («arr.push(1)» is fine).',
      related: ['js-hoisting', 'variables']
    },
    {
      id: 'js-syntax', lang: 'javascript', title: 'SyntaxError: Unexpected token',
      re: [/SyntaxError:\s*(Unexpected token[^\n]*|Unexpected end of input|missing \) after argument list|Unexpected identifier[^\n]*|Invalid or unexpected token|Unexpected string|Unterminated string constant|Unexpected number|missing ; before statement|expected expression, got [^\n]*)/i],
      kw: ['unexpected token', 'unexpected end of input', 'missing ) after argument list', 'unexpected identifier', 'invalid or unexpected token'], dflt: ['a syntax problem'],
      what: 'The JavaScript parser hit something it did not expect: «$1». The code is not valid JS, so nothing in that file runs.',
      causes: ['Missing or extra «)», «}» or «]» (Unexpected end of input = something was not closed).', 'Missing comma between object properties or array items.', 'Missing «+» or comma when joining strings and variables.', 'Smart quotes «“ ”» copied from a document instead of «" "».', 'Using «await» outside an async function, or «import» in a non-module script.'],
      fix: `~~~javascript bad
const user = {
  name: "Asha"
  age: 20
};
console.log("Hello " name);
~~~
~~~javascript good
const user = {
  name: "Asha",
  age: 20,
};
console.log("Hello " + name);
~~~
Paste your code here: I can compile it offline and point to the exact line.`,
      concept: 'Before running a file, the engine **parses** all of it. One grammar mistake anywhere stops the entire script.',
      related: ['debugging']
    },
    {
      id: 'js-already-declared', lang: 'javascript', title: "SyntaxError: Identifier has already been declared",
      re: [/SyntaxError:\s*Identifier '([\w$]+)' has already been declared/i, /SyntaxError:\s*redeclaration of (?:let|const) ([\w$]+)/i],
      kw: ['has already been declared', 'redeclaration of'], dflt: ['the variable'],
      what: '«$1» is declared twice with «let»/«const» (or a mix with «var»/function) in the same scope.',
      causes: ['Copy-pasted code that declares the same variable again.', 'Two «<script>» files declaring the same top-level «let/const».', 'Re-running a snippet in the browser console.'],
      fix: `~~~javascript bad
let count = 0;
let count = 5;
~~~
~~~javascript good
let count = 0;
count = 5;          // reassign, don't redeclare
~~~`,
      concept: '«let» and «const» forbid redeclaration in the same scope, which protects against accidentally clobbering variables (a common problem with «var»).',
      related: ['js-hoisting', 'scope']
    },
    {
      id: 'js-tdz', lang: 'javascript', title: "ReferenceError: Cannot access before initialization",
      re: [/ReferenceError:\s*Cannot access '([\w$]+)' before initialization/i, /ReferenceError:\s*can't access lexical declaration '?([\w$]+)'? before initialization/i],
      kw: ['before initialization'], dflt: ['the variable'],
      what: '«$1» is declared with «let»/«const»/«class», but you used it on a line **above** its declaration.',
      causes: ['Using a variable before the line that declares it.', 'Circular imports between modules.', 'Calling a function expression (const fn = ...) before it is defined.'],
      fix: `~~~javascript bad
greet();
const greet = () => console.log("hi");
~~~
~~~javascript good
const greet = () => console.log("hi");
greet();
// or use a function declaration, which is hoisted:
// function greet() { ... }
~~~`,
      concept: 'The **temporal dead zone (TDZ)**: «let»/«const» are hoisted but stay uninitialised until their declaration line runs.',
      related: ['js-hoisting']
    },
    {
      id: 'js-stack', lang: 'javascript', title: 'RangeError: Maximum call stack size exceeded',
      re: [/RangeError:\s*Maximum call stack size exceeded/i, /InternalError:\s*too much recursion/i],
      kw: ['maximum call stack size exceeded', 'too much recursion'],
      what: 'Functions kept calling each other without ever finishing, until the call stack ran out.',
      causes: ['Recursion without a reachable base case.', 'A setter or getter that sets or reads its own property: «set name(v) { this.name = v; }».', 'Two functions calling each other forever.', 'React: «setState» called during render, or a «useEffect» that triggers itself.'],
      fix: `~~~javascript bad
class User {
  set name(v) { this.name = v; }    // calls the setter again, forever
}
~~~
~~~javascript good
class User {
  set name(v) { this._name = v; }   // store in a different field
  get name() { return this._name; }
}
~~~`,
      concept: 'Each call adds a frame to the stack, and the stack has a fixed size. Recursion must move toward a base case.',
      related: ['recursion']
    },
    {
      id: 'js-promise', lang: 'javascript', title: 'Unhandled promise rejection / Promise { <pending> }',
      re: [/Uncaught \(in promise\)\s*(.*)$/im, /UnhandledPromiseRejection(?:Warning)?:?\s*(.*)$/im, /Promise\s*\{\s*<pending>\s*\}/i],
      kw: ['uncaught in promise', 'unhandled promise rejection', 'promise pending', 'promise { <pending> }'],
      what: 'An async operation failed (or has not finished yet) and your code did not wait for it or handle its error.',
      causes: ['Missing «await», so you got the Promise object instead of its value.', 'No «try/catch» around «await», or no «.catch()» on the promise chain.', 'Using «await» inside «forEach», which does not wait.'],
      fix: `~~~javascript bad
function getUser() {
  const data = fetch("/api/user").then(r => r.json());
  console.log(data);              // Promise { <pending> }
}
~~~
~~~javascript good
async function getUser() {
  try {
    const res = await fetch("/api/user");
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    console.log(data);
  } catch (err) {
    console.error("Request failed:", err);
  }
}
~~~`,
      concept: 'A Promise is a placeholder for a future value. You must **await** it (or use «.then») to get the value, and **catch** it to handle failure.',
      related: ['js-async', 'rest-api', 'exceptions']
    },
    {
      id: 'js-json', lang: 'javascript', title: 'SyntaxError: Unexpected token in JSON',
      re: [/SyntaxError:\s*(?:JSON\.parse:[^\n]*|Unexpected token '?(.)'?,?\s*(?:"[^"]*"\.\.\.\s*)?is not valid JSON|Unexpected token (.) in JSON at position \d+|Unexpected end of JSON input)/i],
      kw: ['in json at position', 'is not valid json', 'unexpected end of json input', 'json.parse', 'unexpected token <'],
      what: 'You tried to parse text as JSON, but it is not valid JSON.',
      causes: ['The server returned an **HTML page** (an error page or a 404) instead of JSON, hence "Unexpected token <".', 'Wrong API URL or path.', 'The response was empty ("Unexpected end of JSON input").', 'Single quotes or trailing commas in a JSON string.', 'Calling «JSON.parse» on something that is already an object.'],
      fix: `~~~javascript good
const res = await fetch(url);
const text = await res.text();          // look at what actually came back
console.log(res.status, text.slice(0, 200));
if (!res.ok) throw new Error("HTTP " + res.status);
const data = JSON.parse(text);
~~~
Valid JSON uses **double quotes** for keys and strings and has no trailing commas.`,
      concept: 'JSON is a strict text format. «res.json()» and «JSON.parse()» throw if even one character is out of place.',
      related: ['rest-api', 'js-async']
    },
    {
      id: 'js-cors', lang: 'javascript', title: 'Blocked by CORS policy',
      re: [/blocked by CORS policy/i, /No 'Access-Control-Allow-Origin' header/i, /Cross-Origin Request Blocked/i],
      kw: ['cors', 'access-control-allow-origin', 'cross-origin'],
      what: 'The browser blocked a request from your page to a **different origin** because that server did not allow it.',
      causes: ['Your frontend (e.g. localhost:5173) calls an API on another port or domain, and the API does not send CORS headers.', 'Opening your HTML with «file://» and fetching local files.', 'The server errored before adding headers, so even a 500 looks like a CORS error.'],
      fix: `CORS has to be fixed **on the server** (or by using a dev proxy):
~~~javascript title="Express server"
const cors = require("cors");
app.use(cors({ origin: "http://localhost:5173" }));
~~~
~~~python title="Flask server"
from flask_cors import CORS
CORS(app, origins=["http://localhost:5173"])
~~~
For local HTML files, serve the folder with a local server (e.g. «npx serve» or «python -m http.server») instead of opening the file directly.`,
      concept: 'The **same-origin policy** stops a web page from reading responses from other sites unless they opt in with «Access-Control-Allow-Origin». It protects users, and the browser enforces it, not your code.',
      related: ['rest-api']
    },
    {
      id: 'js-import-module', lang: 'javascript', title: 'Cannot use import statement outside a module',
      re: [/SyntaxError:\s*Cannot use import statement outside a module/i, /ReferenceError:\s*require is not defined(?: in ES module scope)?/i, /SyntaxError:\s*Unexpected token 'export'/i],
      kw: ['cannot use import statement outside a module', 'require is not defined', "unexpected token 'export'"],
      what: 'You mixed the two JavaScript module systems: ES modules («import/export») and CommonJS («require/module.exports»).',
      causes: ['In Node: using «import» without «"type": "module"» in package.json (or a «.mjs» extension).', 'In the browser: using «import» in a «<script>» without «type="module"».', 'Using «require» in a browser or in an ES module.'],
      fix: `**Browser**
~~~html
<script type="module" src="main.js"></script>
~~~
**Node.js**: either add this to «package.json»:
~~~json
{ "type": "module" }
~~~
or stick to CommonJS: «const fs = require("fs");».`,
      concept: 'ES modules are the modern standard, while CommonJS is Node\'s older system. A file is one or the other, and the runtime must be told which.',
      related: ['compilation']
    },
    {
      id: 'js-map-not-function', lang: 'javascript', title: 'TypeError: x.map is not a function',
      re: [/TypeError:\s*([\w$.]+)\.(map|filter|forEach|reduce|find|push) is not a function/i],
      kw: ['map is not a function', 'foreach is not a function', 'filter is not a function', 'push is not a function'], dflt: ['data', 'map'],
      what: '«$1» is not an array, so it has no «.$2()» method.',
      causes: ['The API returned an **object** wrapping the array, e.g. «{ results: [...] }».', 'The data is still a JSON **string** (not parsed).', 'The initial state is «{}» or «null» instead of «[]».', 'A NodeList or HTMLCollection (from querySelectorAll / getElementsByClassName) is not a full array.'],
      fix: `~~~javascript good
console.log(data);                         // inspect the shape first!
const list = Array.isArray(data) ? data : data.results ?? [];
list.map(item => item.name);

const items = Array.from(document.getElementsByClassName("item"));
~~~
React: initialise list state with «useState([])», not «useState()».`,
      concept: 'Array methods exist only on arrays. Always check the **shape** of data you receive before transforming it.',
      related: ['arrays-lists', 'rest-api']
    },
    {
      id: 'js-nan', lang: 'javascript', title: 'NaN / [object Object] / unexpected "undefined" in output',
      re: [/\bNaN\b/, /\[object Object\]/],
      kw: ['nan', 'not a number', '[object object]', 'object object'],
      what: 'Your output shows «NaN» (Not a Number) or «[object Object]», which means a value was converted in a way you did not intend.',
      causes: ['Math on «undefined» or on non-numeric strings: «undefined + 1», «Number("abc")».', 'Reading input fields (always strings) without converting them.', 'Putting an object into a string: «"User: " + user» gives «[object Object]».'],
      fix: `~~~javascript good
const n = Number(input.value);
if (Number.isNaN(n)) alert("Please type a number");

console.log("User:", user);                 // log the object itself
el.textContent = JSON.stringify(user, null, 2);
~~~`,
      concept: 'JavaScript **coerces** types silently, so «NaN» spreads through every calculation it touches. Validate numbers at the boundary where they enter your program.',
      related: ['type-conversion', 'operators']
    },
    {
      id: 'node-module-not-found', lang: 'javascript', title: "Error: Cannot find module",
      re: [/Error:\s*Cannot find module '([^']+)'/i, /Module not found:\s*(?:Error:\s*)?Can't resolve '([^']+)'/i, /ERR_MODULE_NOT_FOUND[^\n]*'([^']+)'/i],
      kw: ['cannot find module', "can't resolve", 'module not found', 'err_module_not_found'], dflt: ['the module'],
      what: 'Node or your bundler cannot locate «$1».',
      causes: ['The package is not installed: run «npm install».', 'Wrong relative path or file name case («./Utils» vs «./utils»), or a missing «./» for local files.', 'ES modules in Node require the file extension: «import x from "./util.js"».', 'You are running the command from a different folder than the project.'],
      fix: `~~~bash
npm install              # installs everything in package.json
npm install $1           # if it's a package that is missing
~~~
For your own files, check the path relative to the importing file: «import { add } from "./math.js";».`,
      concept: 'Bare names («"express"») are looked up in «node_modules», while paths starting with «./» or «../» are resolved relative to the current file.',
      related: ['compilation']
    },
    {
      id: 'react-key', lang: 'javascript', title: 'React: Each child in a list should have a unique "key" prop',
      re: [/Each child in a list should have a unique "key" prop/i],
      kw: ['unique key prop', 'key prop'],
      what: 'You rendered a list with «.map()» without giving each element a stable «key».',
      causes: ['Missing «key» on the outermost element returned from «.map()».', 'Keys that are not unique.'],
      fix: `~~~javascript bad
{todos.map(t => <li>{t.text}</li>)}
~~~
~~~javascript good
{todos.map(t => <li key={t.id}>{t.text}</li>)}
~~~
Use a stable id from your data. Avoid using the array index if items can be reordered or removed.`,
      concept: 'Keys let React match old and new list items between renders, so it updates the right DOM nodes and keeps the right state.',
      related: ['arrays-lists', 'dom']
    },
    {
      id: 'react-rerenders', lang: 'javascript', title: 'React: Too many re-renders / Invalid hook call',
      re: [/Too many re-renders\. React limits the number of renders/i, /Invalid hook call\. Hooks can only be called inside of the body of a function component/i, /React Hook "?\w+"? is called conditionally/i],
      kw: ['too many re-renders', 'invalid hook call', 'called conditionally'],
      what: 'A React rule was broken: state is being set during render, or a hook is used outside the top level of a component.',
      causes: ['Calling a setter directly in JSX: «onClick={setCount(count + 1)}» runs it during render.', 'Calling hooks inside loops, conditions or regular functions.', 'Two copies of React installed (invalid hook call).'],
      fix: `~~~javascript bad
<button onClick={setCount(count + 1)}>+</button>
~~~
~~~javascript good
<button onClick={() => setCount(count + 1)}>+</button>
~~~
Hooks («useState», «useEffect», …) must be called at the top level of a component, in the same order on every render.`,
      concept: 'Setting state triggers a render. Doing it *during* a render creates an infinite loop. Hooks depend on call order to know which state belongs to which call.',
      related: ['functions', 'js-closures']
    },
    {
      id: 'npm-eresolve', lang: 'javascript', title: 'npm ERR! ERESOLVE could not resolve dependency tree',
      re: [/npm ERR!\s*(?:code\s*)?ERESOLVE/i, /npm ERR!\s*(?:code\s*)?(E\w+)/i],
      kw: ['npm err', 'eresolve', 'could not resolve dependency', 'peer dependency'], dflt: ['an npm error'],
      what: 'npm could not install the packages (code «$1»). Most often two packages require incompatible versions of a shared dependency.',
      causes: ['Peer dependency conflicts (e.g. a library expects React 17 but you have 18).', 'Corrupted «node_modules» or lock file.', 'A network or permission error (EACCES, ENOTFOUND, ETIMEDOUT).'],
      fix: `~~~bash
# try installing while ignoring strict peer conflicts
npm install --legacy-peer-deps

# or clean and reinstall
rm -rf node_modules package-lock.json     # PowerShell: Remove-Item -Recurse -Force node_modules, package-lock.json
npm cache clean --force
npm install
~~~
Better long term: upgrade or downgrade the conflicting package to a compatible version.`,
      concept: 'npm builds a dependency **tree** where every package declares the versions it accepts. If no single version satisfies everyone, installation fails.',
      related: ['git']
    },
    {
      id: 'node-eaddrinuse', lang: 'javascript', title: 'Error: listen EADDRINUSE: address already in use',
      re: [/EADDRINUSE[^\n]*?:(\d+)/i, /address already in use/i, /Port (\d+) is (?:already )?in use/i],
      kw: ['eaddrinuse', 'address already in use', 'port already in use'], dflt: ['that port'],
      what: 'Another program is already using port $1, so your server cannot start on it.',
      causes: ['An earlier run of your server is still running (often in another terminal).', 'Another app uses the same port.'],
      fix: `Stop the old process, or use a different port.
~~~bash
# Windows: find and stop the process using port 3000
netstat -ano | findstr :3000
taskkill /PID <pid> /F

# macOS / Linux
lsof -i :3000
kill -9 <pid>
~~~
Or start on another port: «PORT=3001 npm start» (PowerShell: «$env:PORT=3001; npm start»).`,
      concept: 'Only one process can listen on a given TCP port at a time.',
      related: ['rest-api']
    }
  ]);
})();
