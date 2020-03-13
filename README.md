# VISCERAL
**VI**sual **S**tudio **C**od**E** wo**R**ksp**A**ce c**L**eanup

## Motivation
During the backup of my user profile directory of my Windows machine
I discovered that this directory has a size of greater than 35 GB. This
was somehow shocking for me. What in heavens sake is wasting so much
space?

Afer some analysis I figured out that the

<code>
C:\Users\Account Name\AppData\Roaming\Code\User\workspaceStorage
</code>

directory contains nearly almost all data. A quick search on the internet
shows that this is a common problem:

- [https://github.com/Microsoft/vscode/issues/39692](https://github.com/Microsoft/vscode/issues/39692)
- [https://github.com/microsoft/vscode/issues/56993](https://github.com/microsoft/vscode/issues/56993)

Especially in case you're using a C++ extension like me.

## Solution
There are several things to check to decide if workspace folder can be deleted:

- A file named <code>workspace.json</code> does not exist in this folder.
- A file named <code>workspace.json</code> exists in this folder and
  - There is an entry <code>folder</code> and
  - The folder of previous entry does not exist.

Additional memorize the folder name - if another workspace references the same
folder, mark the second one as to be deleted.
