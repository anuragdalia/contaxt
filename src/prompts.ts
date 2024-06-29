"use strict";

import {input, confirm} from "@inquirer/prompts";

export async function promptRepoPath(defaultPath?: string | null): Promise<string> {
    return input({
        message: 'Enter the path to the git repository:',
        default: defaultPath || undefined
    });
}

export async function promptQuery(): Promise<string> {
    return input({
        message: 'Enter your query:',
    });
}

export async function promptSaveToFile(): Promise<boolean> {
    return confirm({
        message: 'Do you want to save the results to a file?',
    });
}

export async function promptFilePath(): Promise<string> {
    return input({
        message: 'Enter the file path to save the results:',
        default: 'results.txt',
    });
}

export async function promptContinueQuery(): Promise<boolean> {
    return confirm({
        message: 'Do you want to ask another question?',
    });
}
