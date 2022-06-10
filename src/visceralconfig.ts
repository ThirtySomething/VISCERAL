// Object to handle config of program
export interface VisceralConfig {
    // To perform a dry run (true) or to real delete (false) workspaces
    dryrun: boolean;
    // To keep child workspaces (true) or to delete them (false)
    keepchilds: boolean;
}
