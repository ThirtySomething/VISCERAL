# Visceral

**VI**sual **S**tudio **C**od**E** wo**R**ksp**A**ce c**L**eanup

## Motivation

During the backup of my user profile directory of my Windows machine
I discovered that this directory has a size of more than 35 GB. This
was somehow shocking for me. What in heavens sake is wasting so much
space? After some analysis I figured out that the directory

```text
C:\Users\<OSUserName>\AppData\Roaming\Code\User\workspaceStorage
```

contains nearly almost all data. Caused by my heavy use of [VSCode]
I have got a lot of rubbish in the mentioned directory. A quick search
on the internet shows that this seems to be a common problem:

- [VSCode Issue 39692][VSCI39692]
- [VSCode Issue 56993][VSCI56993]

Especially in case you're using the C++ extension like me. You can enable
[VSCode] to write the data to your ```workspace``` directory. From my point
of view this is a kind of pollution which I don't feel happy with. Anyway,
if you want to do so, you have to use the following settings in the setup of
your [VSCode]:

```json
"C_Cpp.default.browse.databaseFilename": "${workspaceFolder}/.vscode/vc.db"
```

## My solution

I will use [VSCode] without much special settings. So [VSCode] stores the
workspace information in the path mentioned above. I've wrote this extension
for [VSCode] to cleanup the ```workspace```:

- Check the ```workspace``` - for each folder found
  - Check if folder exists
  - If not, skip
  - Check if a file named ```workspace.json``` exist in this folder
  - If not, skip
  - Read the content of ```workspace.json```
  - Check if a key ```folder``` exist
  - If not, skip
  - Check if folder exists in filesystem
  - If not, mark workspace for deletion
  - Check if folder was already processed
  - If not, memorize folder
  - If already, mark workspace for deletion
- Delete all marked folders from ```workspace```

### To think about

It might be possible on heavy use of [VSCode] that nested folder structures
exists in the workspace folders. At the moment this is not regarded because
of a clear idea how to solve this.

There is the following scenarios:

```text
...\workspaceStorage\b132868eb8300749d50b8098566e9ade\workspace.json
{
  "folder": "file:///d%3A/Workspaces/GitHub/Visceral"
}
```

```text
...\workspaceStorage\2948453b9749ec2d0e62a599b21110ac\workspace.json
{
  "folder": "file:///d%3A/Workspaces/GitHub/Visceral/src"
}
```

Both are valid workspaces. Each workspace got it's individual workspace
storage. But what is the difference between the ```parent``` settings and
the ```child``` settings? The basic asumption is that because of the parent
child structure the parent is the major workspace and the workspace of the
child is deletable. In case this is the way to go a little bit more logic
has to be implemented.

[VSCode]: https://code.visualstudio.com/
[VSCI39692]: https://github.com/Microsoft/vscode/issues/39692
[VSCI56993]: https://github.com/Microsoft/vscode/issues/56993
