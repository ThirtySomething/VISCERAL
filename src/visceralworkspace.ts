import Url = require('url-parse');
import fs = require('fs');
import * as path from 'path';

// Workspace object
export class VisceralWorkspace {
    // The workspace meta file created by VSCode in a workspace
    static _WorkspaceFile: string = 'workspace.json';
    // The key inside of a workspace file to check
    static _PropertyFolder: string = 'folder';
    // The VS Code workspace folder
    private _workspaceFolder: string = '';
    // The flag if this workspace should be deleted
    private _deleteFolder: boolean = false;
    // The code folder referenced by the workspace
    private _codeFolder: string = '';

    // Default constructor
    constructor(workspaceFolder: string) {
        this._workspaceFolder = workspaceFolder;
    }

    // Get deletion flag
    public getDeleteFolderFlag(): boolean {
        return this._deleteFolder;
    }

    // Set deletion flag
    public setDeleteFolderFlag(value: boolean) {
        this._deleteFolder = value;
    }

    // Gain access to the code folder
    public getCodeFolderString(): string {
        return this._codeFolder;
    }

    // Gain access to the workspace folder
    public getWorkspaceFolderString(): string {
        return this._workspaceFolder;
    }

    // Extend internal data for processing
    public extendData() {
        // Set delete folder flag depending on existence of workspace or not
        this.setDeleteFolderFlag(this.checkFileExistence(this._workspaceFolder, VisceralWorkspace._WorkspaceFile));
        if (!this.getDeleteFolderFlag()) {
            // Figure out the name of the code folder
            this._codeFolder = this.determineCodeFolder(this._workspaceFolder, VisceralWorkspace._WorkspaceFile);
            if (this._codeFolder.length == 0) {
                // Code folder not set
                console.log(`Folderlength is zero, mark workspace for deletion.`);
                this.setDeleteFolderFlag(true);
            } else {
                // Set delete folder flag depending on existence of code folder
                this.setDeleteFolderFlag(!this.fileExist(this._codeFolder));
            }
        }
    }

    // Check existence of file
    private fileExist(fname: string): boolean {
        // Assume file/folder does not exist
        let exists = false;
        if (fs.existsSync(fname)) {
            // File/folder exists, update flag
            exists = true;
        }
        else {
            // File/folder does not exist, set message
            console.log(`[${fname}] not found`);
        }
        return exists;
    }

    // Check for existing file in folder
    private checkFileExistence(workspaceFolder: string, workspaceFile: string): boolean {
        // Assume no deletion
        let deleteMe = false;
        let file2Check = path.join(workspaceFolder, workspaceFile);

        if (!this.fileExist(file2Check)) {
            console.log(`Mark workspace [${workspaceFolder}] for deletion`);
            deleteMe = true;
        }
        return deleteMe;
    }

    // Read key VCWorkspace._PropertyFolder from JSON object
    private determineCodeFolder(workspaceFolder: string, workspaceFile: string): string {
        let codeFolder = "";
        let file2Check = path.join(workspaceFolder, workspaceFile);

        // No check for existence because its previously done
        let obj = this.readFileContent(file2Check);
        if (obj.hasOwnProperty(VisceralWorkspace._PropertyFolder)) {
            codeFolder = this.determineFoldername(obj);
            console.log(`Determined codeFolder [${codeFolder}] for workspace [${file2Check}]`);
        } else {
            console.log(`File [${file2Check}] does not contain key [${VisceralWorkspace._PropertyFolder}]`);
        }

        return codeFolder;
    }

    // Return JSON object for given file
    private readFileContent(filename: string): Object {
        let obj = {};

        try {
            // console.log(`Read content of workspace file [${filename}]`);
            let content = fs.readFileSync(filename, 'utf8');
            obj = JSON.parse(content);
        } catch (err) {
            console.error(err);
        }

        return obj;
    }

    // Get foldername as string from object
    private determineFoldername(object: Object) {
        // Convert to Windows path
        let foldername: string = '';
        let foldernameraw = new Url(object[VisceralWorkspace._PropertyFolder as keyof object]);

        if (foldernameraw['host'].length == 0) {
            if (foldernameraw['pathname'].startsWith('/')) {
                foldername = decodeURIComponent(foldernameraw['pathname'].substring(1));
            } else {
                foldername = decodeURIComponent(foldernameraw['pathname']);
            }
        } else {
            foldername = '//' + decodeURIComponent(foldernameraw['host'] + foldernameraw['pathname']);
        }

        return foldername;
    }
}
