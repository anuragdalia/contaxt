"use strict";

import chat from "./chat";
import { promptRepoPath } from "./prompts";
import { execSync } from "child_process";
import Config from "./config";

async function main() {
    const config = new Config();
    const repoPath = await promptRepoPath(config.getKey("repoPath"));
    config.setKey("repoPath", repoPath);
    try {
        execSync('git status', { cwd: repoPath, stdio: 'ignore' });
    } catch (error) {
        console.error('The provided path is not a valid git repository.');
        process.exit(1);
    }
    await chat(config);
}

main();
