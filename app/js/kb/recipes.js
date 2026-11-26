/* CodeMentor KB — code recipes ("how do I…" / "write a program to…") in several languages */
(function () {
  'use strict';
  window.CM.kb.add('recipes', [
    {
      id: 'reverse-string', title: 'Reverse a string',
      kw: ['reverse a string', 'reverse string', 'string reverse', 'reverse the string', 'reverse word', 'reverse text'],
      approach: 'Walk the characters from the last to the first, or use the language\'s built-in reversing tools.',
      complexity: 'O(n) time, O(n) space for the new string.',
      code: {
        python: `s = "hello"
print(s[::-1])               # slicing with step -1 → "olleh"

# manual version
result = ""
for ch in s:
    result = ch + result
print(result)`,
        javascript: `const s = "hello";
console.log(s.split("").reverse().join(""));   // "olleh"
console.log([...s].reverse().join(""));        // handles emoji better`,
        java: `public class Main {
    public static void main(String[] args) {
        String s = "hello";
        String rev = new StringBuilder(s).reverse().toString();
        System.out.println(rev);   // olleh
    }
}`,
        cpp: `#include <iostream>
#include <string>
#include <algorithm>
using namespace std;
int main() {
    string s = "hello";
    reverse(s.begin(), s.end());
    cout << s << endl;          // olleh
}`,
        c: `#include <stdio.h>
#include <string.h>
int main() {
    char s[] = "hello";
    int n = strlen(s);
    for (int i = 0, j = n - 1; i < j; i++, j--) {   // two pointers, swap in place
        char t = s[i]; s[i] = s[j]; s[j] = t;
    }
    printf("%s\\n", s);         // olleh
    return 0;
}`
      },
      notes: ['Strings are immutable in Python, Java and JS, so reversing creates a new string.', 'The two-pointer swap (C version) is the classic interview answer for in-place reversal.'],
      related: ['strings', 'two-pointers']
    },
    {
      id: 'palindrome', title: 'Check if a string or number is a palindrome',
      kw: ['palindrome', 'check palindrome', 'is palindrome', 'palindrome string', 'palindrome number'],
      approach: 'A palindrome reads the same forwards and backwards. Compare the string with its reverse, or move two pointers inward from both ends.',
      complexity: 'O(n) time. The two-pointer version uses O(1) extra space.',
      code: {
        python: `def is_palindrome(s):
    s = "".join(ch.lower() for ch in s if ch.isalnum())   # ignore case/punctuation
    return s == s[::-1]

print(is_palindrome("Madam"))                # True
print(is_palindrome("A man, a plan, a canal: Panama"))  # True
print(str(121) == str(121)[::-1])            # number palindrome → True`,
        javascript: `function isPalindrome(s) {
  s = s.toLowerCase().replace(/[^a-z0-9]/g, "");
  let i = 0, j = s.length - 1;
  while (i < j) if (s[i++] !== s[j--]) return false;
  return true;
}
console.log(isPalindrome("Madam"), isPalindrome("hello")); // true false`,
        java: `public class Main {
    static boolean isPalindrome(String s) {
        s = s.toLowerCase().replaceAll("[^a-z0-9]", "");
        int i = 0, j = s.length() - 1;
        while (i < j) if (s.charAt(i++) != s.charAt(j--)) return false;
        return true;
    }
    public static void main(String[] args) {
        System.out.println(isPalindrome("Madam"));   // true
    }
}`,
        cpp: `#include <iostream>
#include <string>
using namespace std;
bool isPalindrome(const string& s) {
    int i = 0, j = (int)s.size() - 1;
    while (i < j) if (tolower(s[i++]) != tolower(s[j--])) return false;
    return true;
}
int main() { cout << boolalpha << isPalindrome("Madam") << endl; }`,
        c: `#include <stdio.h>
int main() {
    int n = 12321, original = n, rev = 0;
    while (n > 0) {             // reverse the digits
        rev = rev * 10 + n % 10;
        n /= 10;
    }
    printf("%s\\n", rev == original ? "Palindrome" : "Not palindrome");
    return 0;
}`
      },
      related: ['strings', 'two-pointers', 'reverse-number']
    },
    {
      id: 'prime', title: 'Check if a number is prime',
      kw: ['prime number', 'check prime', 'is prime', 'prime or not', 'primes', 'print prime numbers', 'prime numbers in range'],
      approach: 'A prime is greater than 1 and divisible only by 1 and itself. You only need to test divisors up to √n: if n = a × b, one of a or b must be ≤ √n.',
      complexity: 'O(√n) per number. For all primes up to N, the Sieve of Eratosthenes is O(N log log N).',
      code: {
        python: `def is_prime(n):
    if n < 2:
        return False
    i = 2
    while i * i <= n:          # only up to sqrt(n)
        if n % i == 0:
            return False
        i += 1
    return True

print([x for x in range(1, 30) if is_prime(x)])   # [2, 3, 5, 7, 11, 13, ...]`,
        javascript: `function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
}
console.log(isPrime(29), isPrime(30));   // true false`,
        java: `public class Main {
    static boolean isPrime(int n) {
        if (n < 2) return false;
        for (int i = 2; (long) i * i <= n; i++)
            if (n % i == 0) return false;
        return true;
    }
    public static void main(String[] args) {
        for (int i = 1; i <= 30; i++) if (isPrime(i)) System.out.print(i + " ");
    }
}`,
        cpp: `#include <iostream>
#include <vector>
using namespace std;
int main() {
    int N = 50;
    vector<bool> isPrime(N + 1, true);       // Sieve of Eratosthenes
    isPrime[0] = isPrime[1] = false;
    for (int i = 2; i * i <= N; i++)
        if (isPrime[i])
            for (int j = i * i; j <= N; j += i) isPrime[j] = false;
    for (int i = 2; i <= N; i++) if (isPrime[i]) cout << i << " ";
}`,
        c: `#include <stdio.h>
int isPrime(int n) {
    if (n < 2) return 0;
    for (int i = 2; i * i <= n; i++)
        if (n % i == 0) return 0;
    return 1;
}
int main() {
    int n;
    printf("Enter a number: ");
    scanf("%d", &n);
    printf("%d is %s\\n", n, isPrime(n) ? "prime" : "not prime");
    return 0;
}`
      },
      notes: ['1 is **not** prime. 2 is the only even prime.', 'Checking up to n/2 or n works but is much slower than √n.'],
      related: ['loops', 'big-o']
    },
    {
      id: 'fibonacci', title: 'Fibonacci series',
      kw: ['fibonacci', 'fibonacci series', 'fibonacci sequence', 'fib', 'nth fibonacci'],
      approach: 'Each term is the sum of the previous two: 0, 1, 1, 2, 3, 5, 8… Keep the last two values and roll them forward in a loop.',
      complexity: 'Iterative: O(n) time, O(1) space. Naive recursion: O(2ⁿ). Avoid it for large n.',
      code: {
        python: `n = 10
a, b = 0, 1
for _ in range(n):
    print(a, end=" ")
    a, b = b, a + b          # 0 1 1 2 3 5 8 13 21 34`,
        javascript: `function fibSeries(n) {
  const out = [];
  let a = 0, b = 1;
  for (let i = 0; i < n; i++) { out.push(a); [a, b] = [b, a + b]; }
  return out;
}
console.log(fibSeries(10).join(" "));`,
        java: `public class Main {
    public static void main(String[] args) {
        int n = 10;
        long a = 0, b = 1;
        for (int i = 0; i < n; i++) {
            System.out.print(a + " ");
            long next = a + b;
            a = b;
            b = next;
        }
    }
}`,
        cpp: `#include <iostream>
using namespace std;
int main() {
    int n = 10;
    long long a = 0, b = 1;
    for (int i = 0; i < n; i++) {
        cout << a << " ";
        long long next = a + b; a = b; b = next;
    }
}`,
        c: `#include <stdio.h>
int main() {
    int n = 10;
    long long a = 0, b = 1, next;
    for (int i = 0; i < n; i++) {
        printf("%lld ", a);
        next = a + b; a = b; b = next;
    }
    return 0;
}`
      },
      related: ['recursion', 'dynamic-programming', 'loops']
    },
    {
      id: 'factorial', title: 'Factorial of a number',
      kw: ['factorial', 'factorial of a number', 'n factorial', 'n!'],
      approach: 'n! = 1 × 2 × … × n, and 0! = 1. Multiply in a loop, or use recursion: n! = n × (n−1)!.',
      complexity: 'O(n) time. Factorials grow very fast: 20! is the largest that fits in a 64-bit integer.',
      code: {
        python: `def factorial(n):
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result

import math
print(factorial(5), math.factorial(20))   # 120 2432902008176640000`,
        javascript: `function factorial(n) {
  let r = 1n;                       // BigInt: no overflow
  for (let i = 2n; i <= BigInt(n); i++) r *= i;
  return r;
}
console.log(factorial(5).toString(), factorial(25).toString());`,
        java: `import java.math.BigInteger;

public class Main {
    public static void main(String[] args) {
        long f = 1;
        for (int i = 2; i <= 10; i++) f *= i;
        System.out.println(f);                       // 3628800

        BigInteger big = BigInteger.ONE;             // for large n
        for (int i = 2; i <= 30; i++) big = big.multiply(BigInteger.valueOf(i));
        System.out.println(big);
    }
}`,
        cpp: `#include <iostream>
using namespace std;
unsigned long long factorial(int n) { return n <= 1 ? 1 : n * factorial(n - 1); }
int main() { cout << factorial(10) << endl; }   // 3628800`,
        c: `#include <stdio.h>
int main() {
    int n;
    unsigned long long f = 1;
    printf("Enter n: ");
    scanf("%d", &n);
    for (int i = 2; i <= n; i++) f *= i;
    printf("%d! = %llu\\n", n, f);
    return 0;
}`
      },
      notes: ['Use «long long» / «long» / BigInteger. An «int» overflows after 12!.'],
      related: ['recursion', 'loops']
    },
    {
      id: 'max-min', title: 'Find the largest and smallest element in an array',
      kw: ['largest element', 'smallest element', 'maximum in array', 'minimum in array', 'find max', 'find min', 'max and min', 'biggest number', 'greatest number', 'largest number in array', 'max of array'],
      approach: 'Start with the first element as both min and max, then update them while scanning the rest.',
      complexity: 'O(n) time, O(1) space.',
      code: {
        python: `nums = [42, 7, 19, 88, 3]
print(max(nums), min(nums))        # built-ins: 88 3

largest = smallest = nums[0]
for x in nums[1:]:
    if x > largest: largest = x
    if x < smallest: smallest = x
print(largest, smallest)`,
        javascript: `const nums = [42, 7, 19, 88, 3];
console.log(Math.max(...nums), Math.min(...nums));   // 88 3
const largest = nums.reduce((m, x) => (x > m ? x : m), nums[0]);`,
        java: `import java.util.Arrays;

public class Main {
    public static void main(String[] args) {
        int[] nums = {42, 7, 19, 88, 3};
        int max = nums[0], min = nums[0];
        for (int x : nums) {
            if (x > max) max = x;
            if (x < min) min = x;
        }
        System.out.println(max + " " + min);
        System.out.println(Arrays.stream(nums).max().getAsInt());
    }
}`,
        cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    vector<int> v = {42, 7, 19, 88, 3};
    cout << *max_element(v.begin(), v.end()) << " " << *min_element(v.begin(), v.end()) << endl;
}`,
        c: `#include <stdio.h>
int main() {
    int a[] = {42, 7, 19, 88, 3};
    int n = sizeof(a) / sizeof(a[0]);
    int max = a[0], min = a[0];
    for (int i = 1; i < n; i++) {
        if (a[i] > max) max = a[i];
        if (a[i] < min) min = a[i];
    }
    printf("max=%d min=%d\\n", max, min);
    return 0;
}`
      },
      notes: ['Initialise with the first element, not 0. Otherwise all-negative arrays give the wrong max.'],
      related: ['arrays-lists', 'loops', 'second-largest']
    },
    {
      id: 'second-largest', title: 'Find the second largest element',
      kw: ['second largest', 'second highest', 'second maximum', '2nd largest', 'second biggest', 'second smallest'],
      approach: 'Track the largest and second largest in one pass. When you find a new largest, the old largest becomes second.',
      complexity: 'O(n) time, O(1) space (better than sorting, which is O(n log n)).',
      code: {
        python: `def second_largest(nums):
    first = second = float('-inf')
    for x in nums:
        if x > first:
            first, second = x, first
        elif first > x > second:      # skip duplicates of the max
            second = x
    return None if second == float('-inf') else second

print(second_largest([12, 35, 1, 10, 34, 35]))   # 34`,
        javascript: `function secondLargest(nums) {
  let first = -Infinity, second = -Infinity;
  for (const x of nums) {
    if (x > first) { second = first; first = x; }
    else if (x < first && x > second) second = x;
  }
  return second === -Infinity ? null : second;
}
console.log(secondLargest([12, 35, 1, 10, 34, 35])); // 34`,
        java: `public class Main {
    public static void main(String[] args) {
        int[] a = {12, 35, 1, 10, 34, 35};
        int first = Integer.MIN_VALUE, second = Integer.MIN_VALUE;
        for (int x : a) {
            if (x > first) { second = first; first = x; }
            else if (x < first && x > second) second = x;
        }
        System.out.println(second);   // 34
    }
}`,
        cpp: `#include <iostream>
#include <climits>
using namespace std;
int main() {
    int a[] = {12, 35, 1, 10, 34, 35}, first = INT_MIN, second = INT_MIN;
    for (int x : a) {
        if (x > first) { second = first; first = x; }
        else if (x < first && x > second) second = x;
    }
    cout << second << endl;
}`,
        c: `#include <stdio.h>
#include <limits.h>
int main() {
    int a[] = {12, 35, 1, 10, 34, 35}, n = 6;
    int first = INT_MIN, second = INT_MIN;
    for (int i = 0; i < n; i++) {
        if (a[i] > first) { second = first; first = a[i]; }
        else if (a[i] < first && a[i] > second) second = a[i];
    }
    printf("%d\\n", second);
    return 0;
}`
      },
      related: ['arrays-lists', 'max-min']
    },
    {
      id: 'sum-average', title: 'Sum and average of numbers',
      kw: ['sum of array', 'sum of numbers', 'average', 'mean', 'sum of elements', 'average of numbers', 'calculate average', 'sum of n numbers', 'sum of list'],
      approach: 'Add the values in a loop, then divide by the count. Use floating-point division for the average.',
      complexity: 'O(n) time.',
      code: {
        python: `nums = [70, 85, 90, 65]
total = sum(nums)
avg = total / len(nums) if nums else 0
print(total, round(avg, 2))     # 310 77.5

n = int(input("How many numbers? "))
values = [float(input()) for _ in range(n)]
print("Average:", sum(values) / n)`,
        javascript: `const nums = [70, 85, 90, 65];
const total = nums.reduce((a, b) => a + b, 0);
const avg = nums.length ? total / nums.length : 0;
console.log(total, avg.toFixed(2));`,
        java: `public class Main {
    public static void main(String[] args) {
        int[] nums = {70, 85, 90, 65};
        int total = 0;
        for (int x : nums) total += x;
        double avg = (double) total / nums.length;   // cast to avoid integer division
        System.out.printf("%d %.2f%n", total, avg);
    }
}`,
        cpp: `#include <iostream>
#include <vector>
#include <numeric>
using namespace std;
int main() {
    vector<int> v = {70, 85, 90, 65};
    int total = accumulate(v.begin(), v.end(), 0);
    cout << total << " " << (double)total / v.size() << endl;
}`,
        c: `#include <stdio.h>
int main() {
    int n, x, sum = 0;
    printf("How many numbers? ");
    scanf("%d", &n);
    for (int i = 0; i < n; i++) { scanf("%d", &x); sum += x; }
    printf("Sum = %d, Average = %.2f\\n", sum, n ? (float)sum / n : 0);
    return 0;
}`
      },
      notes: ['Java/C/C++: «total / count» with ints truncates, so cast to double first.', 'Guard against dividing by zero when the list is empty.'],
      related: ['loops', 'operators', 'type-conversion']
    },
    {
      id: 'remove-duplicates', title: 'Remove duplicates from a list or array',
      kw: ['remove duplicates', 'unique elements', 'distinct elements', 'duplicate elements', 'find duplicates', 'delete duplicates', 'dedupe'],
      approach: 'Use a set to remember what you have seen. To keep the original order, add items to the result only the first time you see them.',
      complexity: 'O(n) time with a hash set, O(n) extra space.',
      code: {
        python: `nums = [3, 1, 3, 2, 1, 5]
print(list(set(nums)))              # unique, but order not guaranteed
print(list(dict.fromkeys(nums)))    # unique, keeps order: [3, 1, 2, 5]

seen, dupes = set(), set()
for x in nums:
    (dupes if x in seen else seen).add(x)
print("duplicates:", dupes)         # {1, 3}`,
        javascript: `const nums = [3, 1, 3, 2, 1, 5];
const unique = [...new Set(nums)];           // [3, 1, 2, 5] (keeps order)
const dupes = nums.filter((x, i) => nums.indexOf(x) !== i);
console.log(unique, [...new Set(dupes)]);`,
        java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> nums = List.of(3, 1, 3, 2, 1, 5);
        Set<Integer> unique = new LinkedHashSet<>(nums);   // keeps order
        System.out.println(unique);                         // [3, 1, 2, 5]
    }
}`,
        cpp: `#include <iostream>
#include <vector>
#include <unordered_set>
using namespace std;
int main() {
    vector<int> v = {3, 1, 3, 2, 1, 5}, out;
    unordered_set<int> seen;
    for (int x : v) if (seen.insert(x).second) out.push_back(x);   // insert returns {it, wasNew}
    for (int x : out) cout << x << " ";
}`,
        c: `#include <stdio.h>
int main() {
    int a[] = {3, 1, 3, 2, 1, 5}, n = 6, out[6], m = 0;
    for (int i = 0; i < n; i++) {
        int found = 0;
        for (int j = 0; j < m; j++) if (out[j] == a[i]) { found = 1; break; }
        if (!found) out[m++] = a[i];          // O(n^2) without a hash set
    }
    for (int i = 0; i < m; i++) printf("%d ", out[i]);
    return 0;
}`
      },
      related: ['hash-map', 'arrays-lists']
    },
    {
      id: 'char-frequency', title: 'Count the frequency of characters or words',
      kw: ['frequency', 'count frequency', 'character frequency', 'count characters', 'count occurrences', 'occurrence of each character', 'word count', 'count words', 'frequency of elements', 'most frequent'],
      approach: 'Use a hash map from item to count. Look at each item once and increment its counter.',
      complexity: 'O(n) time, O(k) space for k distinct items.',
      code: {
        python: `from collections import Counter

text = "hello world"
freq = Counter(ch for ch in text if ch != " ")
print(freq)                     # Counter({'l': 3, 'o': 2, ...})
print(freq.most_common(1))      # [('l', 3)]

words = "the cat and the hat".split()
print(len(words), Counter(words)["the"])   # 5 2`,
        javascript: `const text = "hello world";
const freq = {};
for (const ch of text.replace(/\\s/g, "")) freq[ch] = (freq[ch] || 0) + 1;
console.log(freq);   // { h: 1, e: 1, l: 3, o: 2, w: 1, r: 1, d: 1 }`,
        java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        String text = "hello world";
        Map<Character, Integer> freq = new TreeMap<>();
        for (char c : text.toCharArray())
            if (c != ' ') freq.merge(c, 1, Integer::sum);
        System.out.println(freq);   // {d=1, e=1, h=1, l=3, o=2, r=1, w=1}
    }
}`,
        cpp: `#include <iostream>
#include <map>
#include <string>
using namespace std;
int main() {
    string text = "hello world";
    map<char, int> freq;
    for (char c : text) if (c != ' ') freq[c]++;
    for (auto& [ch, n] : freq) cout << ch << ": " << n << endl;
}`,
        c: `#include <stdio.h>
#include <string.h>
int main() {
    char s[] = "hello world";
    int count[256] = {0};                 // one counter per ASCII character
    for (int i = 0; s[i]; i++) count[(unsigned char)s[i]]++;
    for (int c = 0; c < 256; c++)
        if (count[c] && c != ' ') printf("%c: %d\\n", c, count[c]);
    return 0;
}`
      },
      related: ['hash-map', 'strings']
    },
    {
      id: 'sort-array', title: 'Sort an array or list (ascending, descending, custom)',
      kw: ['sort array', 'sort list', 'sort numbers', 'sort in descending order', 'sort descending', 'sort ascending', 'sort strings', 'custom sort', 'sort by key', 'sort objects', 'comparator'],
      approach: 'Use the built-in sort (O(n log n)). Pass a key or comparator to sort by a field or in reverse.',
      complexity: 'O(n log n).',
      code: {
        python: `nums = [5, 2, 9, 1]
print(sorted(nums))                  # new list [1, 2, 5, 9]
nums.sort(reverse=True)              # in place, descending
students = [{"name": "Asha", "marks": 82}, {"name": "Ravi", "marks": 91}]
students.sort(key=lambda s: s["marks"], reverse=True)
print(students[0]["name"])           # Ravi`,
        javascript: `const nums = [5, 2, 9, 1, 10];
nums.sort((a, b) => a - b);          // ascending (comparator needed for numbers!)
nums.sort((a, b) => b - a);          // descending
const students = [{ name: "Asha", marks: 82 }, { name: "Ravi", marks: 91 }];
students.sort((x, y) => y.marks - x.marks);
["banana", "apple"].sort((a, b) => a.localeCompare(b));`,
        java: `import java.util.*;

public class Main {
    record Student(String name, int marks) {}
    public static void main(String[] args) {
        int[] a = {5, 2, 9, 1};
        Arrays.sort(a);                                     // ascending
        Integer[] b = {5, 2, 9, 1};
        Arrays.sort(b, Collections.reverseOrder());         // descending
        List<Student> list = new ArrayList<>(List.of(new Student("Asha", 82), new Student("Ravi", 91)));
        list.sort(Comparator.comparingInt(Student::marks).reversed());
        System.out.println(Arrays.toString(a) + " " + list.get(0).name());
    }
}`,
        cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
struct Student { string name; int marks; };
int main() {
    vector<int> v = {5, 2, 9, 1};
    sort(v.begin(), v.end());                       // ascending
    sort(v.rbegin(), v.rend());                     // descending
    vector<Student> s = {{"Asha", 82}, {"Ravi", 91}};
    sort(s.begin(), s.end(), [](const Student& a, const Student& b) { return a.marks > b.marks; });
    cout << s[0].name << endl;
}`,
        c: `#include <stdio.h>
#include <stdlib.h>
int asc(const void* a, const void* b) { return (*(int*)a > *(int*)b) - (*(int*)a < *(int*)b); }
int main() {
    int a[] = {5, 2, 9, 1}, n = 4;
    qsort(a, n, sizeof(int), asc);
    for (int i = 0; i < n; i++) printf("%d ", a[i]);
    return 0;
}`
      },
      related: ['sorting', 'arrays-lists']
    },
    {
      id: 'bubble-sort', title: 'Bubble sort implementation',
      kw: ['bubble sort', 'bubblesort', 'bubble sort program'],
      approach: 'Repeatedly swap adjacent elements that are out of order. After each pass, the largest remaining element "bubbles" to the end. Stop early if a pass makes no swaps.',
      complexity: 'O(n²) worst/average, O(n) best (already sorted, with the early exit). O(1) space, stable.',
      code: {
        python: `def bubble_sort(a):
    n = len(a)
    for i in range(n - 1):
        swapped = False
        for j in range(n - 1 - i):        # last i items are already in place
            if a[j] > a[j + 1]:
                a[j], a[j + 1] = a[j + 1], a[j]
                swapped = True
        if not swapped:
            break
    return a

print(bubble_sort([64, 34, 25, 12, 22]))`,
        javascript: `function bubbleSort(a) {
  for (let i = 0; i < a.length - 1; i++) {
    let swapped = false;
    for (let j = 0; j < a.length - 1 - i; j++) {
      if (a[j] > a[j + 1]) { [a[j], a[j + 1]] = [a[j + 1], a[j]]; swapped = true; }
    }
    if (!swapped) break;
  }
  return a;
}
console.log(bubbleSort([64, 34, 25, 12, 22]));`,
        java: `import java.util.Arrays;

public class Main {
    public static void main(String[] args) {
        int[] a = {64, 34, 25, 12, 22};
        for (int i = 0; i < a.length - 1; i++) {
            boolean swapped = false;
            for (int j = 0; j < a.length - 1 - i; j++) {
                if (a[j] > a[j + 1]) {
                    int t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;
                    swapped = true;
                }
            }
            if (!swapped) break;
        }
        System.out.println(Arrays.toString(a));
    }
}`,
        cpp: `#include <iostream>
#include <utility>
using namespace std;
int main() {
    int a[] = {64, 34, 25, 12, 22}, n = 5;
    for (int i = 0; i < n - 1; i++)
        for (int j = 0; j < n - 1 - i; j++)
            if (a[j] > a[j + 1]) swap(a[j], a[j + 1]);
    for (int x : a) cout << x << " ";
}`,
        c: `#include <stdio.h>
int main() {
    int a[] = {64, 34, 25, 12, 22}, n = 5;
    for (int i = 0; i < n - 1; i++)
        for (int j = 0; j < n - 1 - i; j++)
            if (a[j] > a[j + 1]) { int t = a[j]; a[j] = a[j + 1]; a[j + 1] = t; }
    for (int i = 0; i < n; i++) printf("%d ", a[i]);
    return 0;
}`
      },
      related: ['sorting', 'big-o']
    },
    {
      id: 'binary-search-recipe', title: 'Binary search program',
      kw: ['binary search program', 'implement binary search', 'binary search code', 'write binary search'],
      approach: 'On a sorted array, compare the target with the middle element and discard the half that cannot contain it.',
      complexity: 'O(log n) time, O(1) space.',
      code: {
        python: `def binary_search(a, target):
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == target: return mid
        if a[mid] < target: lo = mid + 1
        else: hi = mid - 1
    return -1

print(binary_search([1, 3, 5, 7, 9, 11], 7))   # 3`,
        javascript: `function binarySearch(a, t) {
  let lo = 0, hi = a.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (a[mid] === t) return mid;
    a[mid] < t ? (lo = mid + 1) : (hi = mid - 1);
  }
  return -1;
}`,
        java: `static int binarySearch(int[] a, int t) {
    int lo = 0, hi = a.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == t) return mid;
        if (a[mid] < t) lo = mid + 1; else hi = mid - 1;
    }
    return -1;
}`,
        cpp: `int binarySearch(const vector<int>& a, int t) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == t) return mid;
        if (a[mid] < t) lo = mid + 1; else hi = mid - 1;
    }
    return -1;
}`,
        c: `int binarySearch(int a[], int n, int t) {
    int lo = 0, hi = n - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == t) return mid;
        if (a[mid] < t) lo = mid + 1; else hi = mid - 1;
    }
    return -1;
}`
      },
      related: ['binary-search', 'big-o']
    },
    {
      id: 'swap', title: 'Swap two variables',
      kw: ['swap two numbers', 'swap two variables', 'swap', 'swap without third variable', 'swap without temp'],
      approach: 'Use a temporary variable. Python and JS can also swap with tuple or array destructuring.',
      complexity: 'O(1).',
      code: {
        python: `a, b = 5, 9
a, b = b, a            # tuple unpacking
print(a, b)            # 9 5`,
        javascript: `let a = 5, b = 9;
[a, b] = [b, a];
console.log(a, b);     // 9 5`,
        java: `int a = 5, b = 9;
int temp = a;
a = b;
b = temp;
System.out.println(a + " " + b);   // 9 5
// Note: Java passes primitives by value, so a swap(int, int) method can't swap the caller's variables.`,
        cpp: `#include <iostream>
#include <utility>
using namespace std;
void mySwap(int& x, int& y) { int t = x; x = y; y = t; }   // references!
int main() {
    int a = 5, b = 9;
    swap(a, b);          // std::swap
    mySwap(a, b);
    cout << a << " " << b << endl;   // 5 9
}`,
        c: `#include <stdio.h>
void swap(int *x, int *y) { int t = *x; *x = *y; *y = t; }   // needs pointers
int main() {
    int a = 5, b = 9;
    swap(&a, &b);
    printf("%d %d\\n", a, b);   // 9 5
    // without a temp variable: a = a + b; b = a - b; a = a - b;  (risk of overflow)
    return 0;
}`
      },
      related: ['pointers', 'variables', 'functions']
    },
    {
      id: 'read-input', title: 'Read user input (numbers, strings, multiple values)',
      kw: ['take input', 'user input', 'read input', 'input from user', 'read integer', 'scanner input', 'scanf', 'cin', 'read multiple numbers', 'input in one line', 'how to take input', 'keyboard input', 'read a line', 'prompt'],
      approach: 'Read text from standard input, then **convert** it to the type you need. Input always arrives as text.',
      complexity: 'n/a',
      code: {
        python: `name = input("Name: ")                    # str
age = int(input("Age: "))                 # convert to int
a, b = map(int, input("Two numbers: ").split())   # "4 5" -> 4, 5
nums = list(map(int, input().split()))    # a whole line of ints
print(name, age, a + b, nums)`,
        javascript: `// Browser
const age = Number(prompt("Age?"));

// Node.js
const readline = require("readline");
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question("Two numbers: ", (line) => {
  const [a, b] = line.trim().split(/\\s+/).map(Number);
  console.log(a + b);
  rl.close();
});`,
        java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.print("Age: ");
        int age = sc.nextInt();
        sc.nextLine();                   // consume the leftover newline!
        System.out.print("Name: ");
        String name = sc.nextLine();
        System.out.println(name + " is " + age);
        sc.close();
    }
}`,
        cpp: `#include <iostream>
#include <string>
using namespace std;
int main() {
    int age;
    string name;
    cout << "Age: ";
    cin >> age;
    cin.ignore();                // skip the newline before getline
    cout << "Full name: ";
    getline(cin, name);
    cout << name << " is " << age << endl;
}`,
        c: `#include <stdio.h>
#include <string.h>
int main() {
    int age;
    char name[50];
    printf("Age: ");
    scanf("%d", &age);                 // & = address of age
    getchar();                         // eat the newline
    printf("Name: ");
    fgets(name, sizeof name, stdin);
    name[strcspn(name, "\\n")] = '\\0';  // remove trailing newline
    printf("%s is %d\\n", name, age);
    return 0;
}`
      },
      notes: ['In the CodeMentor Playground, type program input into the **Input (stdin)** box before running.'],
      related: ['type-conversion', 'strings']
    },
    {
      id: 'string-to-number', title: 'Convert between string and number',
      kw: ['convert string to int', 'string to integer', 'string to number', 'int to string', 'number to string', 'parse integer', 'convert to int', 'str to int', 'integer to string', 'parseint'],
      approach: 'Use the language\'s parse/convert functions, and handle invalid text.',
      complexity: 'O(length of the string).',
      code: {
        python: `n = int("42")          # str -> int
f = float("3.14")      # str -> float
s = str(42)            # int -> str
try:
    bad = int("4x")
except ValueError:
    print("not a number")`,
        javascript: `const n = Number("42");        // 42  (NaN if invalid)
const i = parseInt("42px", 10); // 42  (stops at first non-digit)
const f = parseFloat("3.14");
const s = String(42);           // or (42).toString()
console.log(Number.isNaN(Number("4x")));   // true`,
        java: `int n = Integer.parseInt("42");
double d = Double.parseDouble("3.14");
String s = String.valueOf(42);          // or Integer.toString(42), or "" + 42
try { Integer.parseInt("4x"); }
catch (NumberFormatException e) { System.out.println("not a number"); }`,
        cpp: `#include <iostream>
#include <string>
using namespace std;
int main() {
    int n = stoi("42");
    double d = stod("3.14");
    string s = to_string(42);
    try { stoi("x4"); } catch (const invalid_argument&) { cout << "not a number\\n"; }
}`,
        c: `#include <stdio.h>
#include <stdlib.h>
int main() {
    int n = atoi("42");                 // no error reporting
    char *end;
    long v = strtol("42abc", &end, 10); // v = 42, end points at "abc"
    char buf[20];
    sprintf(buf, "%d", n);              // int -> string
    printf("%d %ld %s\\n", n, v, buf);
    return 0;
}`
      },
      related: ['type-conversion']
    },
    {
      id: 'file-io', title: 'Read and write a text file',
      kw: ['read file', 'write file', 'file handling', 'read a file', 'write to file', 'file io', 'file i/o', 'open file', 'read text file', 'read file line by line', 'append to file', 'save to file', 'file operations'],
      approach: 'Open the file in the right mode («r» read, «w» write/overwrite, «a» append), read or write, and make sure it gets closed.',
      complexity: 'O(file size).',
      code: {
        python: `# write (creates or overwrites)
with open("notes.txt", "w", encoding="utf-8") as f:
    f.write("first line\\n")
    f.write("second line\\n")

# read line by line ('with' closes the file automatically)
with open("notes.txt", encoding="utf-8") as f:
    for line in f:
        print(line.strip())

# append
with open("notes.txt", "a", encoding="utf-8") as f:
    f.write("appended\\n")`,
        javascript: `// Node.js
const fs = require("fs");
fs.writeFileSync("notes.txt", "first line\\nsecond line\\n", "utf8");
const text = fs.readFileSync("notes.txt", "utf8");
for (const line of text.split("\\n")) if (line) console.log(line);
fs.appendFileSync("notes.txt", "appended\\n");`,
        java: `import java.nio.file.*;
import java.io.IOException;
import java.util.List;

public class Main {
    public static void main(String[] args) throws IOException {
        Path p = Path.of("notes.txt");
        Files.writeString(p, "first line\\nsecond line\\n");
        List<String> lines = Files.readAllLines(p);
        for (String line : lines) System.out.println(line);
        Files.writeString(p, "appended\\n", StandardOpenOption.APPEND);
    }
}`,
        cpp: `#include <fstream>
#include <iostream>
#include <string>
using namespace std;
int main() {
    ofstream out("notes.txt");
    out << "first line\\nsecond line\\n";
    out.close();
    ifstream in("notes.txt");
    string line;
    while (getline(in, line)) cout << line << endl;
}`,
        c: `#include <stdio.h>
int main() {
    FILE *f = fopen("notes.txt", "w");
    if (!f) { perror("open"); return 1; }
    fprintf(f, "first line\\nsecond line\\n");
    fclose(f);

    char line[256];
    f = fopen("notes.txt", "r");
    while (fgets(line, sizeof line, f)) printf("%s", line);
    fclose(f);
    return 0;
}`
      },
      notes: ['Mode «"w"» erases the existing content. Use «"a"» to add to the end.', 'Relative paths are resolved from the folder the program is run from.'],
      related: ['exceptions']
    },
    {
      id: 'even-odd', title: 'Check if a number is even or odd',
      kw: ['even or odd', 'even odd', 'check even', 'odd or even', 'is even', 'is odd'],
      approach: 'A number is even if dividing by 2 leaves remainder 0: «n % 2 == 0».',
      complexity: 'O(1).',
      code: {
        python: `n = int(input("Number: "))
print("Even" if n % 2 == 0 else "Odd")`,
        javascript: `const n = 7;
console.log(n % 2 === 0 ? "Even" : "Odd");`,
        java: `import java.util.Scanner;
public class Main {
    public static void main(String[] args) {
        int n = new Scanner(System.in).nextInt();
        System.out.println(n % 2 == 0 ? "Even" : "Odd");
    }
}`,
        cpp: `#include <iostream>
using namespace std;
int main() { int n; cin >> n; cout << (n % 2 == 0 ? "Even" : "Odd") << endl; }`,
        c: `#include <stdio.h>
int main() {
    int n;
    scanf("%d", &n);
    if (n % 2 == 0) printf("Even\\n"); else printf("Odd\\n");
    return 0;
}`
      },
      notes: ['For negative numbers in Java/C, «-3 % 2» is «-1», so test «!= 0» for odd rather than «== 1».'],
      related: ['operators', 'conditionals']
    },
    {
      id: 'gcd-lcm', title: 'GCD (HCF) and LCM of two numbers',
      kw: ['gcd', 'hcf', 'lcm', 'greatest common divisor', 'highest common factor', 'least common multiple', 'euclidean algorithm'],
      approach: 'Euclid\'s algorithm: gcd(a, b) = gcd(b, a mod b), and gcd(a, 0) = a. Then lcm = a × b / gcd.',
      complexity: 'O(log(min(a, b))).',
      code: {
        python: `def gcd(a, b):
    while b:
        a, b = b, a % b
    return a

a, b = 12, 18
g = gcd(a, b)
print(g, a * b // g)        # 6 36

import math
print(math.gcd(a, b), math.lcm(a, b))   # built-ins (3.9+)`,
        javascript: `const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
const lcm = (a, b) => (a / gcd(a, b)) * b;
console.log(gcd(12, 18), lcm(12, 18));   // 6 36`,
        java: `public class Main {
    static int gcd(int a, int b) { return b == 0 ? a : gcd(b, a % b); }
    public static void main(String[] args) {
        int a = 12, b = 18, g = gcd(a, b);
        System.out.println(g + " " + (a / g * b));   // 6 36
    }
}`,
        cpp: `#include <iostream>
#include <numeric>
using namespace std;
int main() {
    int a = 12, b = 18;
    cout << gcd(a, b) << " " << lcm(a, b) << endl;   // C++17
}`,
        c: `#include <stdio.h>
int gcd(int a, int b) {
    while (b != 0) { int t = b; b = a % b; a = t; }
    return a;
}
int main() {
    int a = 12, b = 18, g = gcd(a, b);
    printf("GCD = %d, LCM = %d\\n", g, a / g * b);
    return 0;
}`
      },
      notes: ['Compute «a / g * b» rather than «a * b / g» to reduce the risk of overflow.'],
      related: ['recursion', 'operators']
    },
    {
      id: 'reverse-number', title: 'Reverse a number / sum of digits',
      kw: ['reverse a number', 'reverse number', 'sum of digits', 'digit sum', 'count digits', 'number of digits', 'reverse digits', 'product of digits'],
      approach: 'Peel off the last digit with «n % 10», then drop it with integer division «n // 10» (or «n / 10» in C/Java). Repeat while n > 0.',
      complexity: 'O(number of digits).',
      code: {
        python: `n = 12345
rev, total, count = 0, 0, 0
while n > 0:
    d = n % 10          # last digit
    rev = rev * 10 + d
    total += d
    count += 1
    n //= 10            # remove last digit
print(rev, total, count)    # 54321 15 5`,
        javascript: `let n = 12345, rev = 0, sum = 0;
while (n > 0) {
  const d = n % 10;
  rev = rev * 10 + d;
  sum += d;
  n = Math.floor(n / 10);    // JS has no integer division operator
}
console.log(rev, sum);`,
        java: `public class Main {
    public static void main(String[] args) {
        int n = 12345, rev = 0, sum = 0;
        while (n > 0) {
            int d = n % 10;
            rev = rev * 10 + d;
            sum += d;
            n /= 10;
        }
        System.out.println(rev + " " + sum);
    }
}`,
        cpp: `#include <iostream>
using namespace std;
int main() {
    int n = 12345, rev = 0, sum = 0;
    while (n > 0) { int d = n % 10; rev = rev * 10 + d; sum += d; n /= 10; }
    cout << rev << " " << sum << endl;
}`,
        c: `#include <stdio.h>
int main() {
    int n, rev = 0, sum = 0;
    printf("Enter a number: ");
    scanf("%d", &n);
    while (n > 0) {
        int d = n % 10;
        rev = rev * 10 + d;
        sum += d;
        n /= 10;
    }
    printf("Reversed = %d, Sum of digits = %d\\n", rev, sum);
    return 0;
}`
      },
      related: ['operators', 'loops', 'palindrome']
    },
    {
      id: 'armstrong', title: 'Armstrong number',
      kw: ['armstrong number', 'armstrong', 'narcissistic number'],
      approach: 'An Armstrong number equals the sum of its digits, each raised to the power of the number of digits (153 = 1³ + 5³ + 3³).',
      complexity: 'O(d) for d digits.',
      code: {
        python: `def is_armstrong(n):
    digits = str(n)
    k = len(digits)
    return n == sum(int(d) ** k for d in digits)

print([x for x in range(1, 1000) if is_armstrong(x)])   # 1..9, 153, 370, 371, 407`,
        javascript: `const isArmstrong = (n) => {
  const s = String(n), k = s.length;
  return [...s].reduce((sum, d) => sum + Number(d) ** k, 0) === n;
};
console.log(isArmstrong(153), isArmstrong(154));`,
        java: `public class Main {
    static boolean isArmstrong(int n) {
        int k = String.valueOf(n).length(), sum = 0, t = n;
        while (t > 0) { sum += (int) Math.pow(t % 10, k); t /= 10; }
        return sum == n;
    }
    public static void main(String[] args) { System.out.println(isArmstrong(153)); }
}`,
        cpp: `#include <iostream>
#include <cmath>
#include <string>
using namespace std;
int main() {
    int n = 153, k = to_string(n).size(), sum = 0;
    for (int t = n; t > 0; t /= 10) sum += (int)round(pow(t % 10, k));
    cout << (sum == n ? "Armstrong" : "Not Armstrong") << endl;
}`,
        c: `#include <stdio.h>
#include <math.h>
int main() {
    int n = 153, t = n, k = 0, sum = 0;
    while (t > 0) { k++; t /= 10; }
    for (t = n; t > 0; t /= 10) sum += (int)round(pow(t % 10, k));
    printf("%d is %san Armstrong number\\n", n, sum == n ? "" : "not ");
    return 0;     /* compile with -lm */
}`
      },
      related: ['reverse-number', 'loops']
    },
    {
      id: 'leap-year', title: 'Check for a leap year',
      kw: ['leap year', 'check leap year', 'is leap year'],
      approach: 'A year is a leap year if it is divisible by 4 **and** (not divisible by 100 **or** divisible by 400).',
      complexity: 'O(1).',
      code: {
        python: `def is_leap(y):
    return y % 4 == 0 and (y % 100 != 0 or y % 400 == 0)

print(is_leap(2024), is_leap(1900), is_leap(2000))   # True False True`,
        javascript: `const isLeap = (y) => y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
console.log(isLeap(2024), isLeap(1900));`,
        java: `static boolean isLeap(int y) {
    return y % 4 == 0 && (y % 100 != 0 || y % 400 == 0);
}`,
        cpp: `bool isLeap(int y) { return y % 4 == 0 && (y % 100 != 0 || y % 400 == 0); }`,
        c: `#include <stdio.h>
int main() {
    int y;
    scanf("%d", &y);
    if (y % 4 == 0 && (y % 100 != 0 || y % 400 == 0)) printf("Leap year\\n");
    else printf("Not a leap year\\n");
    return 0;
}`
      },
      related: ['conditionals', 'operators']
    },
    {
      id: 'patterns', title: 'Print star / number patterns (pyramid, triangle)',
      kw: ['pattern', 'patterns', 'star pattern', 'pyramid', 'triangle pattern', 'print pattern', 'number pattern', 'right triangle', 'diamond pattern', 'pyramid pattern', 'print stars'],
      approach: 'The outer loop controls the **rows**. Inner loops print the **spaces** and then the **stars** for that row. Work out how many of each appear on row i.',
      complexity: 'O(n²) characters printed.',
      code: {
        python: `n = 5
# right triangle
for i in range(1, n + 1):
    print("*" * i)

# centred pyramid
for i in range(1, n + 1):
    print(" " * (n - i) + "*" * (2 * i - 1))

# number triangle
for i in range(1, n + 1):
    print(" ".join(str(j) for j in range(1, i + 1)))`,
        javascript: `const n = 5;
for (let i = 1; i <= n; i++) {
  console.log(" ".repeat(n - i) + "*".repeat(2 * i - 1));
}`,
        java: `public class Main {
    public static void main(String[] args) {
        int n = 5;
        for (int i = 1; i <= n; i++) {
            for (int s = 0; s < n - i; s++) System.out.print(" ");      // spaces
            for (int k = 0; k < 2 * i - 1; k++) System.out.print("*");  // stars
            System.out.println();
        }
    }
}`,
        cpp: `#include <iostream>
using namespace std;
int main() {
    int n = 5;
    for (int i = 1; i <= n; i++) {
        cout << string(n - i, ' ') << string(2 * i - 1, '*') << endl;
    }
}`,
        c: `#include <stdio.h>
int main() {
    int n = 5;
    for (int i = 1; i <= n; i++) {
        for (int s = 1; s <= n - i; s++) printf(" ");
        for (int k = 1; k <= 2 * i - 1; k++) printf("*");
        printf("\\n");
    }
    return 0;
}`
      },
      notes: ['Draw the pattern for n = 4 on paper and count the spaces and stars per row first. The formulas then become obvious.'],
      related: ['loops']
    },
    {
      id: 'two-sum', title: 'Two Sum (find a pair that adds up to a target)',
      kw: ['two sum', 'pair sum', 'pair with given sum', 'find pair', 'target sum', 'twosum'],
      approach: 'Scan once with a hash map from value to index. For each number, check whether «target - number» has already been seen.',
      complexity: 'O(n) time, O(n) space (vs O(n²) with two nested loops).',
      code: {
        python: `def two_sum(nums, target):
    seen = {}                       # value -> index
    for i, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], i]
        seen[x] = i
    return None

print(two_sum([2, 7, 11, 15], 9))   # [0, 1]`,
        javascript: `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return null;
}
console.log(twoSum([2, 7, 11, 15], 9));`,
        java: `import java.util.*;

public class Main {
    static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            Integer j = seen.get(target - nums[i]);
            if (j != null) return new int[]{j, i};
            seen.put(nums[i], i);
        }
        return null;
    }
    public static void main(String[] args) {
        System.out.println(Arrays.toString(twoSum(new int[]{2, 7, 11, 15}, 9)));
    }
}`,
        cpp: `#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;
int main() {
    vector<int> nums = {2, 7, 11, 15};
    int target = 9;
    unordered_map<int, int> seen;
    for (int i = 0; i < (int)nums.size(); i++) {
        auto it = seen.find(target - nums[i]);
        if (it != seen.end()) { cout << it->second << " " << i << endl; break; }
        seen[nums[i]] = i;
    }
}`,
        c: `#include <stdio.h>
int main() {
    int a[] = {2, 7, 11, 15}, n = 4, target = 9;
    for (int i = 0; i < n; i++)               /* O(n^2) brute force (no built-in hash map in C) */
        for (int j = i + 1; j < n; j++)
            if (a[i] + a[j] == target) { printf("%d %d\\n", i, j); return 0; }
    return 0;
}`
      },
      related: ['hash-map', 'two-pointers', 'big-o']
    },
    {
      id: 'anagram', title: 'Check if two strings are anagrams',
      kw: ['anagram', 'anagrams', 'check anagram', 'are anagrams'],
      approach: 'Two strings are anagrams if they contain the same characters with the same counts. Compare sorted versions, or compare character counts.',
      complexity: 'Sorting: O(n log n). Counting: O(n).',
      code: {
        python: `from collections import Counter

def is_anagram(a, b):
    a, b = a.replace(" ", "").lower(), b.replace(" ", "").lower()
    return Counter(a) == Counter(b)          # or: sorted(a) == sorted(b)

print(is_anagram("Listen", "Silent"))        # True`,
        javascript: `const norm = (s) => s.toLowerCase().replace(/\\s/g, "").split("").sort().join("");
const isAnagram = (a, b) => norm(a) === norm(b);
console.log(isAnagram("Listen", "Silent"));`,
        java: `import java.util.Arrays;

public class Main {
    static boolean isAnagram(String a, String b) {
        char[] x = a.replaceAll("\\\\s", "").toLowerCase().toCharArray();
        char[] y = b.replaceAll("\\\\s", "").toLowerCase().toCharArray();
        Arrays.sort(x); Arrays.sort(y);
        return Arrays.equals(x, y);
    }
    public static void main(String[] args) { System.out.println(isAnagram("Listen", "Silent")); }
}`,
        cpp: `#include <iostream>
#include <string>
#include <algorithm>
using namespace std;
int main() {
    string a = "listen", b = "silent";
    sort(a.begin(), a.end()); sort(b.begin(), b.end());
    cout << (a == b ? "Anagrams" : "Not anagrams") << endl;
}`,
        c: `#include <stdio.h>
#include <ctype.h>
int main() {
    char a[] = "listen", b[] = "silent";
    int count[26] = {0};
    for (int i = 0; a[i]; i++) count[tolower(a[i]) - 'a']++;
    for (int i = 0; b[i]; i++) count[tolower(b[i]) - 'a']--;
    for (int i = 0; i < 26; i++) if (count[i]) { printf("Not anagrams\\n"); return 0; }
    printf("Anagrams\\n");
    return 0;
}`
      },
      related: ['strings', 'hash-map', 'sorting']
    },
    {
      id: 'count-vowels', title: 'Count vowels and consonants',
      kw: ['count vowels', 'vowels', 'vowel count', 'consonants', 'count consonants', 'number of vowels'],
      approach: 'Loop through the characters. If it is a letter, check whether it is in «aeiou» (case-insensitive).',
      complexity: 'O(n).',
      code: {
        python: `s = "Hello World"
vowels = sum(1 for ch in s.lower() if ch in "aeiou")
consonants = sum(1 for ch in s.lower() if ch.isalpha() and ch not in "aeiou")
print(vowels, consonants)    # 3 7`,
        javascript: `const s = "Hello World";
const vowels = (s.match(/[aeiou]/gi) || []).length;
const consonants = (s.match(/[b-df-hj-np-tv-z]/gi) || []).length;
console.log(vowels, consonants);`,
        java: `public class Main {
    public static void main(String[] args) {
        String s = "Hello World".toLowerCase();
        int v = 0, c = 0;
        for (char ch : s.toCharArray()) {
            if ("aeiou".indexOf(ch) >= 0) v++;
            else if (Character.isLetter(ch)) c++;
        }
        System.out.println(v + " " + c);
    }
}`,
        cpp: `#include <iostream>
#include <string>
#include <cctype>
using namespace std;
int main() {
    string s = "Hello World";
    int v = 0, c = 0;
    for (char ch : s) {
        ch = tolower(ch);
        if (string("aeiou").find(ch) != string::npos) v++;
        else if (isalpha(ch)) c++;
    }
    cout << v << " " << c << endl;
}`,
        c: `#include <stdio.h>
#include <ctype.h>
#include <string.h>
int main() {
    char s[] = "Hello World";
    int v = 0, c = 0;
    for (int i = 0; s[i]; i++) {
        char ch = tolower(s[i]);
        if (strchr("aeiou", ch)) v++;
        else if (isalpha(ch)) c++;
    }
    printf("Vowels: %d, Consonants: %d\\n", v, c);
    return 0;
}`
      },
      related: ['strings', 'loops']
    },
    {
      id: 'matrix', title: 'Matrix addition, multiplication and transpose',
      kw: ['matrix', 'matrix multiplication', 'matrix addition', 'transpose', 'transpose of matrix', '2d array', 'multiply matrices', 'add matrices'],
      approach: 'Use nested loops over rows and columns. For multiplication, entry «C[i][j]» is the dot product of row i of A and column j of B. This needs cols(A) == rows(B).',
      complexity: 'Addition and transpose: O(n·m). Multiplication: O(n³) for n×n.',
      code: {
        python: `A = [[1, 2], [3, 4]]
B = [[5, 6], [7, 8]]
n = len(A)

add = [[A[i][j] + B[i][j] for j in range(n)] for i in range(n)]
transpose = [[A[j][i] for j in range(n)] for i in range(n)]
mul = [[sum(A[i][k] * B[k][j] for k in range(n)) for j in range(n)] for i in range(n)]
print(add, transpose, mul)   # mul = [[19, 22], [43, 50]]`,
        javascript: `const A = [[1, 2], [3, 4]], B = [[5, 6], [7, 8]];
const mul = A.map((row, i) => B[0].map((_, j) => row.reduce((s, _, k) => s + A[i][k] * B[k][j], 0)));
const transpose = A[0].map((_, j) => A.map(row => row[j]));
console.log(mul, transpose);`,
        java: `public class Main {
    public static void main(String[] args) {
        int[][] A = {{1, 2}, {3, 4}}, B = {{5, 6}, {7, 8}};
        int n = 2;
        int[][] C = new int[n][n];
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                for (int k = 0; k < n; k++)
                    C[i][j] += A[i][k] * B[k][j];
        for (int[] row : C) System.out.println(java.util.Arrays.toString(row));
    }
}`,
        cpp: `#include <iostream>
using namespace std;
int main() {
    int A[2][2] = {{1, 2}, {3, 4}}, B[2][2] = {{5, 6}, {7, 8}}, C[2][2] = {};
    for (int i = 0; i < 2; i++)
        for (int j = 0; j < 2; j++)
            for (int k = 0; k < 2; k++)
                C[i][j] += A[i][k] * B[k][j];
    for (auto& row : C) { for (int x : row) cout << x << " "; cout << endl; }
}`,
        c: `#include <stdio.h>
int main() {
    int A[2][2] = {{1, 2}, {3, 4}}, T[2][2];
    for (int i = 0; i < 2; i++)
        for (int j = 0; j < 2; j++)
            T[j][i] = A[i][j];              // transpose
    for (int i = 0; i < 2; i++) { for (int j = 0; j < 2; j++) printf("%d ", T[i][j]); printf("\\n"); }
    return 0;
}`
      },
      notes: ['Initialise the result matrix to zeros before adding into it.'],
      related: ['arrays-lists', 'loops']
    },
    {
      id: 'reverse-array', title: 'Reverse an array or list',
      kw: ['reverse array', 'reverse a list', 'reverse list', 'reverse an array', 'reverse elements'],
      approach: 'Swap the first and last elements, move both indexes inward, and stop when they meet (two pointers).',
      complexity: 'O(n) time, O(1) extra space for the in-place version.',
      code: {
        python: `a = [1, 2, 3, 4, 5]
print(a[::-1])       # new reversed list
a.reverse()          # in place
print(a)`,
        javascript: `const a = [1, 2, 3, 4, 5];
console.log([...a].reverse());   // copy, then reverse (reverse() mutates!)`,
        java: `int[] a = {1, 2, 3, 4, 5};
for (int i = 0, j = a.length - 1; i < j; i++, j--) {
    int t = a[i]; a[i] = a[j]; a[j] = t;
}
System.out.println(java.util.Arrays.toString(a));
// For a List: Collections.reverse(list);`,
        cpp: `#include <algorithm>
#include <vector>
#include <iostream>
int main() {
    std::vector<int> v = {1, 2, 3, 4, 5};
    std::reverse(v.begin(), v.end());
    for (int x : v) std::cout << x << " ";
}`,
        c: `#include <stdio.h>
int main() {
    int a[] = {1, 2, 3, 4, 5}, n = 5;
    for (int i = 0, j = n - 1; i < j; i++, j--) { int t = a[i]; a[i] = a[j]; a[j] = t; }
    for (int i = 0; i < n; i++) printf("%d ", a[i]);
    return 0;
}`
      },
      related: ['arrays-lists', 'two-pointers']
    },
    {
      id: 'fetch-api', title: 'Call a REST API / fetch JSON data',
      kw: ['fetch data', 'call api', 'fetch api', 'http request', 'get request', 'post request', 'fetch json', 'api call', 'make a request', 'consume api'],
      approach: 'Send an HTTP request, check the status, then parse the JSON body. (Needs network access to the API.)',
      complexity: 'n/a',
      code: {
        javascript: `async function getTodo(id) {
  const res = await fetch("https://jsonplaceholder.typicode.com/todos/" + id);
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}
getTodo(1).then(console.log).catch(console.error);`,
        python: `import requests   # pip install requests

res = requests.get("https://jsonplaceholder.typicode.com/todos/1", timeout=10)
res.raise_for_status()
print(res.json()["title"])`,
        java: `import java.net.URI;
import java.net.http.*;

public class Main {
    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest req = HttpRequest.newBuilder(URI.create("https://jsonplaceholder.typicode.com/todos/1")).build();
        HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
        System.out.println(res.statusCode() + " " + res.body());
    }
}`
      },
      related: ['rest-api', 'js-async']
    },
    {
      id: 'random-number', title: 'Generate a random number',
      kw: ['random number', 'random', 'generate random', 'random integer', 'random between', 'dice roll'],
      approach: 'Use the language\'s random library and scale it to your range, being careful about whether the upper bound is included.',
      complexity: 'O(1).',
      code: {
        python: `import random
print(random.randint(1, 6))        # 1..6 inclusive
print(random.random())             # 0.0 <= x < 1.0
print(random.choice(["a", "b"]))   # random element`,
        javascript: `const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
console.log(randInt(1, 6));        // 1..6 inclusive`,
        java: `import java.util.Random;
public class Main {
    public static void main(String[] args) {
        Random r = new Random();
        System.out.println(r.nextInt(6) + 1);    // 1..6
    }
}`,
        cpp: `#include <iostream>
#include <random>
int main() {
    std::mt19937 gen(std::random_device{}());
    std::uniform_int_distribution<int> dist(1, 6);
    std::cout << dist(gen) << std::endl;
}`,
        c: `#include <stdio.h>
#include <stdlib.h>
#include <time.h>
int main() {
    srand(time(NULL));                  // seed once
    printf("%d\\n", rand() % 6 + 1);     // 1..6
    return 0;
}`
      },
      related: ['functions']
    }
  ]);
})();
