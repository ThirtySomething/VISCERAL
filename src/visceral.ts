import * as path from 'path';
import fs = require('fs');
import Url = require('url-parse');
var fsUtils = require("nodejs-fs-utils");

/*
********************************************************************************
* Visceral - A Visual Studio Code extension
********************************************************************************
*/
export class Visceral {
    // The location on windows
    private _WinWorkspacePath = '\\Code\\User\\workspaceStorage';
    // The file created by VSCode in a workspace
    private _WorkspaceFile = 'workspace.json';
    // The key inside of a workspace file to check
    private _PropertyFolder = 'folder';
    // Will be the full path to the VSCode workspace
    private _workspaceBaseDir: string = '';
    // Flag that a path is set
    private _basePathSet: boolean = false;
    // Array to memorize already checked paths (not workspaces!)
    private _PathsChecked: string[];
    // Array of workspaces to delete
    private _PathsToDelete: string[];

    // Default constructor
    constructor() {
        // Initialize arrays
        this._PathsChecked = [];
        this._PathsToDelete = [];
        // Get platform from VSCode - extension worsk only on Windows at the moment
        if (process.platform === "win32") {
            this._setWorkspaceBaseDirWindows();
        }
        else {
            console.log(`Running not on windows, don't know the location workspace folder.`);
        }
    }

    // Determine full path to workspaces on windows
    private _setWorkspaceBaseDirWindows() {
        this._workspaceBaseDir = path.join(String(process.env['APPDATA']), this._WinWorkspacePath);
        this._basePathSet = true;
        console.log(`Running on Windows, workspaceBaseDir is [${this._workspaceBaseDir}]`);
    }

    // Check workspaces for deletion
    public Process(): string {
        // Init message for user feedback
        let result = '';
        // Init arrays again - user might call more than once
        this._PathsChecked = [];
        this._PathsToDelete = [];

        // If a path is set
        if (this._basePathSet) {
            // Read all workspaces...
            let folderList = fs.readdirSync(this._workspaceBaseDir, { withFileTypes: true });

            folderList.forEach(fileEntry => {
                // Analyze each workspace
                this.determineFoldersToDelete(fileEntry.name);
            });
            // Delete all workspaces marked for deletion
            result = this.deleteObsoleteWorkspaces();
        }
        else {
            // No processing possible
            result = `No processing, workspace base directory not set.`;
            console.log(result);
        }

        return result;
    }

    // Handle folders marked to delete
    private deleteObsoleteWorkspaces(): string {
        // Total free size
        let sizeTotalBytes = 0;
        // Loop over all marked folders
        for (let i = 0; i < this._PathsToDelete.length; i++) {
            console.log(`Deleting workspace [${this._PathsToDelete[i]}].`);
            // Determine folder size in bytes
            let bytes = fsUtils.fsizeSync(this._PathsToDelete[i]);
            // Update total size
            sizeTotalBytes += bytes;
            // No deletion at the moment
            // fsUtils.rmdirsSync(this._PathsToDelete[i]);
        }
        // Return message
        let result = `Deleted [${this._PathsToDelete.length}] workspaces and freed [${sizeTotalBytes}] bytes.`;
        console.log(result);
        return result;
    }

    // Handle workspaces for analysis
    private determineFoldersToDelete(files: string) {
        let workspaceFolder = path.join(this._workspaceBaseDir, files);
        // Perform analysis
        if (!this.processWorkspaceFolder(workspaceFolder)) {
            // This folder needs manual check
            console.log(`Check workspace [${workspaceFolder}] manually.`);
        };
    }

    // Analyse workspace folder
    private processWorkspaceFolder(workspace: string): boolean {
        let result = false;
        let workspaceFile = path.join(workspace, this._WorkspaceFile);

        // Abort when workspace does not exist
        console.log(`Analyzing workspace [${workspace}]`);
        if (!fs.existsSync(workspace)) {
            console.log(`Workspace [${workspaceFile}] does not exist`);
            return result;
        }

        // Abort in case property `folder` is not available in workspace file
        console.log(`Read content of workspace file [${workspaceFile}]`);
        let obj = this.readFileContent(workspaceFile);
        if (!obj.hasOwnProperty(this._PropertyFolder)) {
            console.log(`File [${workspaceFile}] does not contain key [${this._PropertyFolder}]`);
            return result;
        }

        // Flag workspace file has folder property
        result = true;

        // Get foldername from object
        let foldername = this.determineFoldername(obj);
        console.log(`Folder to check [${foldername}]`);

        // If folder does not exist
        if (!fs.existsSync(foldername)) {
            console.log(`Folder [${foldername}] does not exist, mark workspace [${workspace}] for delete`);
            // Mark workspace for deletion
            this._PathsToDelete.push(workspace);
            return result;
        }

        // Check if folder is already memorized from another workspace
        let keepFolder = true;
        for (let i = 0; i < this._PathsChecked.length; i++) {
            if (foldername === this._PathsChecked[i]) {
                console.log(`Folder [${foldername}] already processed`);
                keepFolder = false;
                break;
            }
        }

        if (keepFolder === true) {
            // Memorize folder
            this._PathsChecked.push(foldername);
        } else {
            // Folder already memorized, mark workspace for deletion
            console.log(`Folder [${foldername}] is duplicated, mark workspace [${workspace}] for delete`);
            this._PathsToDelete.push(workspace);
            return result;
        }

        return result;
    }

    // Read content of workspace file
    private readFileContent(filename: string): Object {
        let obj = {};

        try {
            let content = fs.readFileSync(filename, 'utf8');
            obj = JSON.parse(content);
        } catch (err) {
            console.error(err);
        }

        return obj;
    }

    // Get foldername as string from object.
    private determineFoldername(object: Object) {
        // Convert to Windows path
        let foldernameraw = new Url(object[this._PropertyFolder]);
        let foldername = decodeURIComponent(foldernameraw['host'] + foldernameraw['pathname']);

        return foldername;
    }
}