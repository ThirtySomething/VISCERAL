import * as path from 'path';
import fs = require('fs');
var Url = require('url-parse');
var fsUtils = require("nodejs-fs-utils");

export class Visceral {
    private _WorkspacePath = '\\Code\\User\\workspaceStorage';
    private _WorkspaceFile = 'workspace.json';
    private _PropertyFolder = 'folder';

    private _workspaceBaseDir: string = '';
    private _basePathSet: boolean = false;

    private _PathsChecked: string[];
    private _PathsToDelete: string[];

    constructor() {
        this._PathsChecked = [];
        this._PathsToDelete = [];
        if (process.platform === "win32") {
            this._setWorkspaceBaseDirWindows();
        }
        else {
            console.log(`Running not on windows, don't know the location workspace folder.`);
        }
    }

    private _setWorkspaceBaseDirWindows() {
        this._workspaceBaseDir = path.join(String(process.env['APPDATA']), this._WorkspacePath);
        this._basePathSet = true;
        console.log(`Running on Windows, workspaceBaseDir is [${this._workspaceBaseDir}]`);
    }

    public Process(): string {
        let result = '';
        this._PathsChecked = [];

        if (this._basePathSet) {
            fs.readdir(this._workspaceBaseDir, (err: any, files: string[]) => {
                if (err)
                    console.log(err);
                else {
                    this.determineFoldersToDelete(files);
                    result = this.deleteObsoleteWorkspaces();
                }
            });
        }
        else {
            result = `No processing, workspace base directory not set.`;
            console.log(result);
        }

        return result;
    }

    private deleteObsoleteWorkspaces(): string {
        let size = 0;
        for (let i = 0; i < this._PathsToDelete.length; i++) {
            console.log(`Deleting workspace [${this._PathsToDelete[i]}].`);
            let bytes = fsUtils.fsizeSync(this._PathsToDelete[i]);
            size += bytes;
            // fsUtils.rmdirsSync(this._PathsToDelete[i]);
        }
        let result = `Deleted [${this._PathsToDelete.length}] workspaces and freed [${size}] bytes.`;
        console.log(result);
        return result;
    }

    private determineFoldersToDelete(files: string[]) {
        let foldersTotal = 0;
        let foldersProcessed = 0;
        files.forEach(file => {
            let workspaceFolder = path.join(this._workspaceBaseDir, file);
            let val = this.processWorkspaceFolder(workspaceFolder);
            foldersProcessed += val;
            if (val == 0) {
                console.log(`Check workspace [${workspaceFolder}].`);
            }
        });
        console.log(`Folders total [${foldersTotal}], folders processed [${foldersProcessed}].`);
    }

    private processWorkspaceFolder(workspace: string): number {
        let result = 0;
        let workspaceFile = path.join(workspace, this._WorkspaceFile);

        console.log(`Analyzing workspace [${workspace}]`);
        if (!fs.existsSync(workspace)) {
            console.log(`Workspace [${workspaceFile}] does not exist`);
            return result;
        }

        console.log(`Read content of workspace file [${workspaceFile}]`);
        let obj = this.readFileContent(workspaceFile);
        if (!obj.hasOwnProperty(this._PropertyFolder)) {
            console.log(`File [${workspaceFile}] does not contain key [${this._PropertyFolder}]`);
            return result;
        }

        let foldernameraw = new Url(obj[this._PropertyFolder]);
        let foldername = decodeURIComponent(foldernameraw['host'] + foldernameraw['pathname']);
        console.log(`Folder to check [${foldername}]`);
        if (!fs.existsSync(foldername)) {
            console.log(`Folder [${foldername}] does not exist, mark workspace [${workspace}] for delete`);
            this._PathsToDelete.push(workspace);
            result++;
            return result;
        }

        let keepFolder = true;
        for (let i = 0; i < this._PathsChecked.length; i++) {
            if (foldername === this._PathsChecked[i]) {
                console.log(`Folder [${foldername}] already processed`);
                keepFolder = false;
                break;
            }
        }

        result++;

        if (keepFolder === true) {
            this._PathsChecked.push(foldername);
        } else {
            console.log(`Folder [${foldername}] is duplicated, mark workspace [${workspace}] for delete`);
            this._PathsToDelete.push(workspace);
            return result;
        }

        return result;
    }

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
}