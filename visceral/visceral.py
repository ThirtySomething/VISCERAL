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

    file_prefix = 'file:'
    local_path_prefix = '///'
    network_path_prefix = '//'
    folder_key = 'folder'
    workspace_file = 'workspace.json'
    workspace_location = '\\Code\\User\\workspaceStorage'

    def __init__(self, dryrun=True):
        '''
        Memorize workspace in class variable
        '''
        self.workspace = ''.join([os.path.expandvars('${APPDATA}'), Visceral.workspace_location])
        self.dryrun = dryrun
        logging.info('workspace [%s]', '{}'.format(self.workspace))
        logging.info('dryrun [%s]', '{}'.format(self.dryrun))

    def _get_size(self, start_path='.'):
        '''
        Calculate size of passed directory
        See: https://stackoverflow.com/questions/1392413/calculating-a-directorys-size-using-python
        '''
        total_size = 0
        for dirpath, dirnames, filenames in os.walk(start_path):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                # skip if it is symbolic link
                if not os.path.islink(fp):
                    total_size += os.path.getsize(fp)
        return total_size

    def _get_readable_size(self, size_in_bytes):
        size_in_kb = int(size_in_bytes / 1024)
        size_in_mb = int(size_in_kb / 1024)
        return size_in_mb

    def cleanup(self):
        '''
        Cleanup process:
        - First get list of workspace folders
        - Check inside each ws folder for file 'workspace.json'
        - Inside this json file check for entry 'folder'
        '''
        logging.debug('Cleanup workspace [%s]', '{}'.format(self.workspace))
        vscode_workspaces = [f.path for f in os.scandir(self.workspace) if f.is_dir()]
        fs_folders = {}
        workspaces_total = 0
        workspaces_deleted = 0
        workspaces_size_total = 0
        for current_subfolder in vscode_workspaces:
            workspaces_total += 1
            folder = ''
            delete_folder = False
            ws_name = os.path.basename(os.path.normpath(current_subfolder))
            logging.debug('')
            logging.debug('Check current workspace [%s]', '{}'.format(ws_name))
            # Join path of current subfolder with workspace file
            wsfile = os.path.join(current_subfolder, Visceral.workspace_file)
            # File workspace.json not found
            if not path.exists(wsfile):
                logging.debug('File [%s] not found', '{}'.format(Visceral.workspace_file))
                logging.debug('Manual check of workspace [%s] required', '{}'.format(current_subfolder))
                continue
            # File workspace.json found
            logging.debug('File [%s] found, check for entry [%s]', '{}'.format(Visceral.workspace_file), '{}'.format(Visceral.folder_key))
            with open(wsfile) as json_file:
                data = json.load(json_file)
                # Entry folder not found
                if Visceral.folder_key not in data:
                    logging.debug('No entry for [%s] found', '{}'.format(Visceral.folder_key))
                    logging.debug('Manual check of workspace [%s] required', '{}'.format(current_subfolder))
                    continue
                # Entry folder found
                folder = urllib.parse.unquote(data[Visceral.folder_key])
                folder = folder.replace(Visceral.file_prefix, '').replace(Visceral.local_path_prefix, '')
            # Check for network path
            if folder.startswith(Visceral.network_path_prefix):
                logging.debug('Folder [%s] is network path', '{}'.format(folder))
                logging.debug('Manual check of workspace [%s] required', '{}'.format(current_subfolder))
                continue
            # Check folder for existence
            if not path.exists(folder):
                logging.debug('Folder [%s] does not exist', '{}'.format(folder))
                logging.debug('Mark [%s] to delete', '{}'.format(current_subfolder))
                delete_folder = True
            else:
                logging.debug('Folder [%s] exist', '{}'.format(folder))
                if folder not in fs_folders.keys():
                    logging.debug('Keep [%s]', '{}'.format(current_subfolder))
                    fs_folders[folder] = current_subfolder
                else:
                    logging.debug('Duplicate [%s]', '{}'.format(folder))
                    logging.debug('Mark [%s] to delete', '{}'.format(current_subfolder))
                    delete_folder = True
            if delete_folder:
                workspaces_deleted += 1
                size = self._get_size(current_subfolder)
                workspaces_size_total += size
                logging.debug('Workspace [%s] deleted', '{}'.format(ws_name))
                logging.debug('Released [%s] Mbytes', '{}'.format(self._get_readable_size(size)))
                if not self.dryrun:
                    shutil.rmtree(current_subfolder, ignore_errors=True)
        logging.info('')
        logging.info('Workspaces total [%s]', '{}'.format(workspaces_total))
        logging.info('Workspaces deleted [%s]', '{}'.format(workspaces_deleted))
        logging.info('Workspaces Mbytes released [%s]', '{}'.format(self._get_readable_size(workspaces_size_total)))
