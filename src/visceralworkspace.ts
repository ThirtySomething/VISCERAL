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
    public getDeleteFolder(): boolean {
        return this._deleteFolder;
    }

    // Set deletion flag
    public setDeleteFolder(value: boolean) {
        this._deleteFolder = value;
    }

    // Gain access to the code folder
    public getCodeFolder(): string {
        return this._codeFolder;
    }

    // Gain access to the workspace folder
    public getWorkspaceFolder(): string {
        return this._workspaceFolder;
    }

    // Extend internal data for processing
    public extendData() {
        this.setDeleteFolder(this.handleFileExistence(this._workspaceFolder, VisceralWorkspace._WorkspaceFile));
        if (!this.getDeleteFolder()) {
            this._codeFolder = this.determineCodeFolder(this._workspaceFolder, VisceralWorkspace._WorkspaceFile);
            if (this._codeFolder.length == 0) {
                console.log(`Folderlength is zero, mark workspace for deletion.`);
                this.setDeleteFolder(true);
            } else {
                this.setDeleteFolder(!this.fileExist(this._codeFolder));
            }
        }
    }

    // Check existence of file
    private fileExist(fname: string): boolean {
        let exists = true;
        if (!fs.existsSync(fname)) {
            console.log(`[${fname}] not found`);
            exists = false;
        }
        return exists;
    }

    // Check for existing file in folder
    private handleFileExistence(workspaceFolder: string, workspaceFile: string): boolean {
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

        let obj = this.readFileContent(file2Check);
        if (obj.hasOwnProperty(VisceralWorkspace._PropertyFolder)) {
            codeFolder = this.determineFoldername(obj);
            console.log(`Determine codeFolder [${codeFolder}] for workspace [${file2Check}]`);
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
