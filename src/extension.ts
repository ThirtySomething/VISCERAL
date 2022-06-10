import * as vscode from 'vscode';
import { Visceral } from './visceral';
import { VisceralConfig } from './visceralconfig';

export function activate(context: vscode.ExtensionContext) {
    // Register command of extension
    let disposable = vscode.commands.registerCommand('visceral.cleanup', () => {
        let settings: VisceralConfig = vscode.workspace.getConfiguration().get<VisceralConfig>('visceral') as VisceralConfig;
        let visceral = new Visceral(settings);
        let result = visceral.Process();
        vscode.window.showInformationMessage(result);
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }
