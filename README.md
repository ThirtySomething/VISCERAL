# VISCERAL
**VI**sual **S**tudio **C**od**E** wo**R**ksp**A**ce c**L**eanup

## Motivation
During the backup of my user profile directory of my Windows machine
I discovered that this directory has a size of more than 35 GB. This
was somehow shocking for me. What in heavens sake is wasting so much
space? Afer some analysis I figured out that the this directory

```
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

## Solution
I will use [VSCode] without much special settings. So [VSCode] stores the
workspace information in the path mentioned above. I've wrote a quick and
dirty script in Python to do the following:

- A file named ```workspace.json``` does not exist in this folder.
  - Manual check
- A file named ```workspace.json``` exists in this folder and
  - There is no entry ```folder```
    - Manual check
  - There is an entry ```folder```
    - Folder is a network path
      - Manual check
    - Folder is a filesystem path
      - Folder does not exist
        - Mark workspace to delete
      - Folder exist
        - Keep workspace
        - Memorize folder in keep list
      - Folder already in keep list
        - Mark workspace to delete

## Hints
The current code will perform a dry run. This means that nothing will be deleted.
In case you really want to delete workspaces, you have to change some code in
the file ```program.py``` from

```pyton
# Initialize program with location of VSCode workspace
workspace = Visceral()
```

to

```pyton
# Initialize program with location of VSCode workspace
workspace = Visceral(False)
```

The script will log to the file ```program.log``` - in case you want to see
more information, you have to change in the file ```program.py``` from

```pyton
# Setup logging for dealing with UTF-8, unfortunately not available for basicConfig
LOGGER_SETUP = logging.getLogger()
LOGGER_SETUP.setLevel(logging.INFO)
# LOGGER_SETUP.setLevel(logging.DEBUG)
```

to

```pyton
# Setup logging for dealing with UTF-8, unfortunately not available for basicConfig
LOGGER_SETUP = logging.getLogger()
LOGGER_SETUP.setLevel(logging.INFO)
LOGGER_SETUP.setLevel(logging.DEBUG)
```

[VSCode]: https://code.visualstudio.com/
