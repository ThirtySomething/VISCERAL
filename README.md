# VISCERAL

**VI**sual **S**tudio **C**od**E** wo**R**ksp**A**ce c**L**eanup

## Motivation

During the backup of my user profile directory of my Windows machine
I discovered that this directory has a size of more than 35 GB. This
was somehow shocking for me. What in heavens sake is wasting so much
space? After some analysis I figured out that the directory

```dos
C:\Users\Account Name\AppData\Roaming\Code\User\workspaceStorage
```

contains nearly almost all data. Caused by my heavy use of [VSCode]
I have got a lot of rubbish in the mentioned directory. A quick search
on the internet shows that this seems to be a common problem:

- [https://github.com/Microsoft/vscode/issues/39692](https://github.com/Microsoft/vscode/issues/39692)
- [https://github.com/microsoft/vscode/issues/56993](https://github.com/microsoft/vscode/issues/56993)

Especially in case you're using a C++ extension like me. You can enable
[VSCode] to write the data to your ```workspace``` directory. From my point
of view this is a kind of pollution which I don't feel happy with. Anyway,
if you want to do so, you have to use the following setting:

```json
"C_Cpp.default.browse.databaseFilename": "${workspaceFolder}/.vscode/vc.db"
```

## My solution

I will use [VSCode] without much special settings. So [VSCode] stores the
workspace information in the path mentioned above. I've wrote an extension
for [VSCode] to cleanup the ```workspace```:

- Check the ```workspace``` - for each folder found
  - Check if a file named ```workspace.json``` exist in this folder
  - If not, skip this workspace
  - If yes, read the content of ```workspace.json```
  - Check if a key ```folder``` exist in this file
  - If not, skip this workspace
  - If yes, check if folder exists in filesystem
  - If folder does not exist, mark workspace for deletion
- Delete all marked folders from ```workspace```

[VSCode]: https://code.visualstudio.com/
