import * as assert from 'assert';

import * as vscode from 'vscode';
import { Visceral } from './../../visceral';
import { VisceralConfig } from './../../visceralconfig';

suite('Viseral Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Sample test', () => {
        assert.strictEqual(-1, [1, 2, 3].indexOf(5));
        assert.strictEqual(-1, [1, 2, 3].indexOf(0));
    });
});
