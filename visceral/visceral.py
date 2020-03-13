'''
******************************************************************************
Copyright 2020 ThirtySomething
******************************************************************************
This file is part of Visceral.
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
******************************************************************************
'''
import json
import logging
import os
import urllib.parse
import shutil
from os import path


class Visceral:
    '''
    The script will
    - Check workspace of Visual Studio Code
    - If file "workspace.json" exists, check mentioned folder for existence
    - Delete workspace if folder does not exist
    '''

    file_prefix = 'file:///'
    folder_key = 'folder'
    workspace_file = 'workspace.json'

    def __init__(self, workspace):
        '''
        Memorize workspace in class variable
        '''
        self.workspace = workspace
        logging.debug('workspace [%s]', '{}'.format(workspace))

    def execute(self):
        '''
        Cleanup process:
        - First get list of workspace folders (ws folder)
        - Check inside each ws folder for file 'workspace.json'
        '''
        logging.debug('Cleanup workspace [%s]', '{}'.format(self.workspace))
        list_subfolders_with_paths = [f.path for f in os.scandir(self.workspace) if f.is_dir()]
        fs_folders = {}
        for current_subfolder in list_subfolders_with_paths:
            folder = ''
            delete_folder = False
            ws_name = os.path.basename(os.path.normpath(current_subfolder))
            logging.debug('')
            logging.debug('Check current workspace [%s]', '{}'.format(current_subfolder))
            # Join path of current subfolder with workspace file
            wsfile = os.path.join(current_subfolder, Visceral.workspace_file)
            if not path.exists(wsfile):
                logging.debug('Current workspace [%s] contains no [%s], mark to delete', '{}'.format(ws_name), '{}'.format(Visceral.workspace_file))
                folder = wsfile
                delete_folder = True
            if not delete_folder:
                with open(wsfile) as json_file:
                    data = json.load(json_file)
                    if Visceral.folder_key not in data:
                        logging.debug('Current workspace [%s] has no folder location defined [%s] in workspace file [%s], check manual', '{}'.format(ws_name), '{}'.format(data), '{}'.format(Visceral.workspace_file))
                        continue
                    folder = urllib.parse.unquote(data[Visceral.folder_key])
                    folder = folder.replace(Visceral.file_prefix, '')
            if not delete_folder:
                if not path.exists(folder):
                    delete_folder = True
                    logging.debug('Current workspace [%s] has no corresponding folder [%s], mark to delete', '{}'.format(ws_name), '{}'.format(folder))
                else:
                    logging.debug('Current workspace [%s] has corresponding folder [%s], keep it', '{}'.format(ws_name), '{}'.format(folder))
                    if folder not in fs_folders.keys():
                        fs_folders[folder] = current_subfolder
                    else:
                        logging.debug('Current [%s] workspace is a duplicate [%s], mark to delete', '{}'.format(ws_name), '{}'.format(folder))
                        delete_folder = True
            if delete_folder:
                shutil.rmtree(current_subfolder, ignore_errors=True)
                logging.debug('Current workspace [%s] deleted ([%s])', '{}'.format(ws_name), '{}'.format(current_subfolder))
        logging.debug('')
        for ws_folder in sorted(fs_folders.keys()):
            logging.debug('Folder [%s] - [%s]', '{}'.format(ws_folder), '{}'.format(ws_name))
