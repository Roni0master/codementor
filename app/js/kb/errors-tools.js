/* CodeMentor KB — tooling, terminal, Git and SQL errors */
(function () {
  'use strict';
  window.CM.kb.add('errors', [
    {
      id: 'tool-not-recognized', lang: 'bash', title: "'X' is not recognized as an internal or external command",
      re: [/'([\w.+-]+)' is not recognized as an internal or external command/i, /The term '([\w.+-]+)' is not recognized as (?:the )?name of a cmdlet/i, /([\w.+-]+): command not found/i, /bash: ([\w.+-]+): not found/i],
      kw: ['is not recognized as an internal or external command', 'command not found', 'is not recognized as the name of a cmdlet'], dflt: ['the program'],
      what: 'Your terminal cannot find a program called «$1». Either it is not installed, or its folder is not on the **PATH**.',
      causes: ['The tool (Python, Node, Java, gcc, git…) is not installed.', 'It is installed, but its folder was not added to PATH (common with Python on Windows: the "Add python.exe to PATH" checkbox).', 'The terminal was opened **before** installing. Close it and open a new one.', 'Windows: the command name differs. Try «py» instead of «python», and use «javac» from a JDK (not a JRE).'],
      fix: `1. **Check whether it is installed**: open a **new** terminal and run «$1 --version».
2. **Windows, Python**: re-run the installer → *Modify* → enable **"Add Python to environment variables"**, or use the launcher: «py --version», «py -m pip install …».
3. **Add it to PATH manually**: Start → "Edit the system environment variables" → *Environment Variables* → select «Path» → *Edit* → *New* → paste the folder containing the «.exe» (e.g. «C:\\Program Files\\Java\\jdk-21\\bin»).
4. Restart the terminal or VS Code.
~~~powershell
where.exe $1          # Windows: shows where it is found, if anywhere
~~~`,
      concept: '**PATH** is an environment variable listing the folders your shell searches when you type a command name. If the program\'s folder isn\'t in that list, the shell can\'t find it, even if it is installed.',
      related: ['compilation']
    },
    {
      id: 'tool-pip-externally', lang: 'python', title: 'pip: externally-managed-environment / Permission denied',
      re: [/error:\s*externally-managed-environment/i, /PermissionError:\s*\[Errno 13\] Permission denied:\s*'?([^'\n]*)'?/i, /Permission denied/i, /EACCES/i],
      kw: ['externally-managed-environment', 'permission denied', 'errno 13', 'eacces', 'access is denied'], dflt: ['the file'],
      what: 'The operating system refused access ($1): either the location is protected, or the file is open or locked elsewhere.',
      causes: ['Installing packages into the system Python (Linux/macOS) or a protected folder.', 'The file is open in another program (Excel, an editor) on Windows.', 'Trying to write to a folder you lack rights to (e.g. Program Files).', 'Opening a folder as if it were a file.'],
      fix: `Use a **virtual environment** for project packages:
~~~bash
python -m venv .venv
# Windows
.venv\\Scripts\\activate
# macOS / Linux
source .venv/bin/activate
pip install requests
~~~
For files: close programs that have the file open, and write into your own user/project folder.`,
      concept: 'Virtual environments give each project its own isolated set of packages, so you never need admin rights and projects don\'t conflict.',
      related: ['debugging']
    },
    {
      id: 'git-not-repo', lang: 'bash', title: 'fatal: not a git repository',
      re: [/fatal:\s*not a git repository/i],
      kw: ['not a git repository'],
      what: 'You ran a Git command in a folder that is not inside a Git repository.',
      causes: ['You are in the wrong folder.', 'The repository was never initialised.'],
      fix: `~~~bash
cd path/to/your/project      # go to the right folder
git init                     # or create a repository here
~~~`,
      concept: 'Git stores history in a hidden «.git» folder at the project root. Commands look for it in the current folder and its parents.',
      related: ['git']
    },
    {
      id: 'git-push-rejected', lang: 'bash', title: 'git push rejected (non-fast-forward / fetch first)',
      re: [/\[rejected\][^\n]*\((non-fast-forward|fetch first)\)/i, /Updates were rejected because the (?:tip of your current branch is behind|remote contains work)/i, /failed to push some refs/i],
      kw: ['push rejected', 'non-fast-forward', 'fetch first', 'failed to push some refs', 'updates were rejected'],
      what: 'The remote branch has commits you don\'t have locally, so Git refuses to overwrite them.',
      causes: ['Someone else pushed, or you edited files on GitHub directly (e.g. created a README).', 'You rewrote local history (amend or rebase) after pushing.'],
      fix: `~~~bash
git pull --rebase origin main     # bring in remote commits, replay yours on top
# fix any conflicts, then:
git push
~~~
Avoid «git push --force» on shared branches: it deletes other people's commits.`,
      concept: 'A push only "fast-forwards" the remote branch. If the histories diverged, you first have to integrate (merge or rebase) the remote work.',
      related: ['git']
    },
    {
      id: 'git-merge-conflict', lang: 'bash', title: 'Git merge conflict',
      re: [/CONFLICT \(content\):\s*Merge conflict in ([^\n]+)/i, /Automatic merge failed; fix conflicts/i, /^<<<<<<< /m],
      kw: ['merge conflict', 'automatic merge failed', '<<<<<<<'], dflt: ['a file'],
      what: 'Git could not automatically combine changes in «$1», because both sides edited the same lines.',
      causes: ['You and someone else (or two of your branches) changed the same part of a file.'],
      fix: `Open the file and look for the conflict markers:
~~~text
<<<<<<< HEAD
your version
=======
their version
>>>>>>> feature
~~~
1. Edit the file so it contains the correct final code, and **delete the markers**.
2. Mark it resolved and finish:
~~~bash
git add <file>
git commit           # or: git rebase --continue
~~~
To cancel instead: «git merge --abort».`,
      concept: 'Git merges line by line. When both sides changed the same lines, only a human can decide which result is right.',
      related: ['git']
    },
    {
      id: 'git-identity', lang: 'bash', title: 'Git: Please tell me who you are / Author identity unknown',
      re: [/Please tell me who you are/i, /Author identity unknown/i, /unable to auto-detect email address/i],
      kw: ['please tell me who you are', 'author identity unknown'],
      what: 'Git needs your name and email to record who made each commit.',
      causes: ['A fresh Git install that has not been configured yet.'],
      fix: `~~~bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
~~~`,
      concept: 'Every commit stores an author name and email. They are part of the permanent history.',
      related: ['git']
    },
    {
      id: 'git-auth', lang: 'bash', title: 'Git: Authentication failed / Support for password authentication was removed',
      re: [/Support for password authentication was removed/i, /Authentication failed for/i, /Permission denied \(publickey\)/i, /remote: Invalid username or (?:password|token)/i],
      kw: ['authentication failed', 'password authentication was removed', 'permission denied (publickey)', 'invalid username or password'],
      what: 'GitHub rejected your credentials. Account passwords no longer work for Git operations.',
      causes: ['Typing your GitHub password instead of a **personal access token**.', 'No SSH key added to your GitHub account (for «git@github.com:» URLs).', 'Old cached credentials.'],
      fix: `Pick one:
- **Easiest**: install Git Credential Manager (bundled with Git for Windows) or the GitHub CLI and run «gh auth login».
- **HTTPS + token**: GitHub → Settings → Developer settings → Personal access tokens → generate one, and use it as the password.
- **SSH**: «ssh-keygen -t ed25519», then add the «.pub» key under GitHub → Settings → SSH keys.`,
      concept: 'GitHub requires token-based or key-based authentication for Git, because tokens can be scoped and revoked.',
      related: ['git']
    },
    {
      id: 'sql-syntax', lang: 'sql', title: 'SQL syntax error near …',
      re: [/You have an error in your SQL syntax[^\n]*near '([^']*)'/i, /syntax error at or near "([^"]*)"/i, /near "([^"]*)": syntax error/i, /ORA-00933|ORA-00936/i],
      kw: ['error in your sql syntax', 'syntax error at or near', 'sql syntax'], dflt: ['the reported spot'],
      what: 'The database could not parse the query. The problem is at or just **before** «$1».',
      causes: ['A missing comma between columns, or an extra comma before «FROM».', 'Clauses in the wrong order (e.g. «WHERE» after «GROUP BY»).', 'Strings without single quotes, or double quotes used for strings (MySQL/Postgres differ).', 'Using a reserved word as a column name («order», «group», «user») without quoting it.'],
      fix: `~~~sql bad
SELECT name age, FROM students WHERE name = Asha
~~~
~~~sql good
SELECT name, age FROM students WHERE name = 'Asha';
~~~
Clause order: «SELECT → FROM → JOIN → WHERE → GROUP BY → HAVING → ORDER BY → LIMIT».`,
      concept: 'SQL has a fixed grammar and clause order. String literals use **single quotes**.',
      related: ['sql-joins']
    },
    {
      id: 'sql-unknown-column', lang: 'sql', title: 'Unknown column / no such column / ambiguous column',
      re: [/Unknown column '([^']+)'/i, /no such column:\s*([\w.]+)/i, /column "([^"]+)" does not exist/i, /Column '([^']+)' in field list is ambiguous/i, /ambiguous column name:\s*([\w.]+)/i],
      kw: ['unknown column', 'no such column', 'does not exist', 'ambiguous'], dflt: ['the column'],
      what: 'The database cannot resolve the column «$1».',
      causes: ['A typo, or a column that really does not exist in that table.', 'A string written without quotes, so it is treated as a column name.', '**Ambiguous**: two joined tables both have that column (e.g. «id»).', 'Using a SELECT alias in WHERE (not allowed in most databases).'],
      fix: `~~~sql good
SELECT s.id, s.name, e.course
FROM students s
JOIN enrollments e ON e.student_id = s.id   -- prefix columns with table aliases
WHERE s.name = 'Asha';                       -- text in single quotes
~~~`,
      concept: 'Every column reference must uniquely identify one column of the tables in the FROM clause.',
      related: ['sql-joins']
    },
    {
      id: 'sql-constraint', lang: 'sql', title: 'Duplicate entry / UNIQUE or FOREIGN KEY constraint failed',
      re: [/Duplicate entry '([^']*)' for key/i, /UNIQUE constraint failed:\s*([\w.]+)/i, /FOREIGN KEY constraint fail(?:ed|s)/i, /violates (unique|foreign key|not-null) constraint/i, /NOT NULL constraint failed:\s*([\w.]+)/i],
      kw: ['duplicate entry', 'unique constraint failed', 'foreign key constraint', 'violates', 'not null constraint'], dflt: ['the value'],
      what: 'The database rejected the change because it breaks a rule on the table ($1).',
      causes: ['Inserting a primary key or unique value that already exists.', 'A foreign key pointing at a row that does not exist (or deleting a parent that still has children).', 'Leaving a NOT NULL column empty.'],
      fix: `~~~sql good
-- let the database generate ids
CREATE TABLE students (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL);

-- insert the parent row before the child row
INSERT INTO students (email) VALUES ('asha@example.com');
INSERT INTO enrollments (student_id, course) VALUES (1, 'DSA');
~~~`,
      concept: 'Constraints are rules the database enforces to keep data consistent: unique ids, valid references and required fields.',
      related: ['sql-joins']
    }
  ]);
})();
