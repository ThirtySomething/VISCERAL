import fs = require('fs');
import * as path from 'path';
import Url = require('url-parse');
var fsUtils = require('nodejs-fs-utils');
import { VisceralWorkspace } from './visceralworkspace';
import { VisceralConfig } from './visceralconfig';

/*
********************************************************************************
* Visceral - VIsual Studio CodE woRkspAce cLeanup
********************************************************************************
*/
export class Visceral {
    // The location on windows
    private _WinWorkspacePath: string = '\\Code\\User\\workspaceStorage';
    // Will be the full path to the VSCode workspace
    private _workspaceBaseDir: string = '';
    // Settings object
    private _settings: VisceralConfig;

    // Default constructor
    constructor(settings: VisceralConfig) {
        this._settings = settings;
        // Get platform from VSCode - extension works only on Windows at the moment
        switch (process.platform) {
            case "win32":
                this._setWorkspaceBaseDirWindows();
                break;
            default:
                console.log(`Running not on Windows, don't know the location of workspace folder.`);
                break;
        }
    }

    // Determine full path to workspaces on Windows
    private _setWorkspaceBaseDirWindows() {
        this._workspaceBaseDir = path.join(String(process.env['APPDATA']), this._WinWorkspacePath);
        console.log(`Running on Windows, workspaceBaseDir is [${this._workspaceBaseDir}]`);
    }

    // Check workspaces for deletion
    public Process(): string {
        // Init message for user feedback
        let result = '';
        // Init arrays again - user might call more than once
        let workspaceList: VisceralWorkspace[] = [];

        // If a path is set
        if (this._workspaceBaseDir.length > 0) {
            // Read all workspaces...
            let folderList = fs.readdirSync(this._workspaceBaseDir, { withFileTypes: true });

            // Build list of workspace objects
            folderList.forEach(fileEntry => {
                // Workspace will marked for deletion when
                // - workspace.json does not exist in workspace
                // - workspace.json does not contain folder entry
                // - code folder does not exist
                this.extendWorkspaceList(workspaceList, fileEntry.name);
            });

            // Mark child workspaces for deletion if configured
            if (!this._settings.keepchilds) {
                this.markChildFolders(workspaceList);
            }

            // Remove all workspaces marked for deletion
            result = this.deleteObsoleteWorkspaces(workspaceList);

            // Extend info about keep childs
            if (this._settings.keepchilds) {
                result = '[Keep childs] ' + result;
            }

            // Extend info about dry run
            if (this._settings.dryrun) {
                result = 'Dry run: ' + result;
            }

        }
        else {
            // No processing possible
            result = `No processing, workspace base directory not set.`;
            console.log(result);
        }

        return result;
    }

    // Delete all workspaces marked for deletion
    private deleteObsoleteWorkspaces(workspaces: VisceralWorkspace[]): string {
        // Total free size
        let sizeTotalBytes = 0;
        let countDeleted = 0;

        // Loop over all marked folders
        for (let i = 0; i < workspaces.length; i++) {
            if (false == workspaces[i].getDeleteFolderFlag()) {
                continue;
            }
            let workspace = workspaces[i].getWorkspaceFolderString();
            // Determine folder size in bytes
            let bytes = fsUtils.fsizeSync(workspace);
            // Update total size
            sizeTotalBytes += bytes;
            // No deletion if dry run is active
            if (!this._settings.dryrun) {
                console.log(`Delete workspace [${workspace}].`);
                fsUtils.rmdirsSync(workspace);
            } else {
                console.log(`Dry run on workspace [${workspace}].`);
            }
            countDeleted++;
        }
        // Return message
        let result = `Deleted [${countDeleted}] workspaces and freed [${sizeTotalBytes}] bytes.`;
        console.log(result);
        return result;
    }

    // Mark all workspaced for deletion where a parent codepath exists
    private markChildFolders(workspacelist: VisceralWorkspace[]) {
        // Need at least two elements to work on
        if (2 > workspacelist.length) {
            console.log(`Too few elements [${workspacelist.length}].`);
            return;
        }
        for (let outer = 1; outer <= (workspacelist.length - 2); outer++) {
            let wsOuter = workspacelist[outer];
            if (wsOuter.getDeleteFolderFlag()) {
                // console.log(`Outer workspace [${JSON.stringify(wsOuter)}]`);
                continue;
            }
            for (let inner = (outer + 1); inner < (workspacelist.length - 1); inner++) {
                let wsInner = workspacelist[inner];
                if (wsInner.getDeleteFolderFlag()) {
                    // console.log(`Inner workspace [${JSON.stringify(wsInner)}]`);
                    continue;
                }
                if (wsInner.getCodeFolderString().includes(wsOuter.getCodeFolderString())) {
                    console.log(`Folder [${wsInner.getCodeFolderString()}] is child folder of [${wsOuter.getCodeFolderString()}], marked for delete.`);
                    wsInner.setDeleteFolderFlag(true);
                }
            }
        }
    }

    // Extract folder names and add to list
    private extendWorkspaceList(workspaceList: VisceralWorkspace[], foldername: string) {
        let workspaceFolder = path.join(this._workspaceBaseDir, foldername);
        let workspaceObj = new VisceralWorkspace(workspaceFolder);
        workspaceObj.extendData();
        workspaceList.push(workspaceObj);
    }
}