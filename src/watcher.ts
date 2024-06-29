"use strict";

import * as chokidar from "chokidar";
import {isFileIndexed} from "./hash";
import ConfigManager from "./config";
import {Indexer} from "./indexer";

interface FileChange {
    filePath: string;
    repoPath: string;
}

export default class Watcher {

    protected indexer: Indexer;
    private fileChangeQueue: FileChange[] = [];
    private isProcessingQueue: boolean = false;
    private readonly repoPath: string;

    constructor(config: ConfigManager, indexer: Indexer) {
        this.indexer = indexer;
        const repoPath = config.getKey("repoPath");
        if (!repoPath) {
            throw new Error("RepoPath broken?");
        }
        this.repoPath = repoPath;
        console.log(`Watcher initialized with repoPath: ${this.repoPath}`);
    }

    private async processFileChangeQueue(): Promise<void> {
        if (this.isProcessingQueue || this.fileChangeQueue.length === 0) return;
        this.isProcessingQueue = true;
        console.log('Processing file change queue.');
        while (this.fileChangeQueue.length > 0) {
            const {filePath, repoPath} = this.fileChangeQueue.shift()!;
            const relativePath = filePath.substring(repoPath.length + 1);
            if (this.indexer.ig.ignores(relativePath)) continue;
            console.log(`Processing file: ${relativePath}`);
            if (!isFileIndexed(repoPath, relativePath)) {
                await this.indexer.indexFile(relativePath);
                console.log(`File ${relativePath} re-indexed.`);
            } else {
                console.log(`File ${relativePath} not indexed, skipping.`);
            }
        }
        this.isProcessingQueue = false;
        console.log('Finished processing file change queue.');
    }

    watchProject(): void {
        const watcher = chokidar.watch(this.repoPath, {
            ignored: /(^|[\/\\])\../, // ignore dotfiles
            persistent: true,
        });
        console.log(`Started watching project at: ${this.repoPath}`);
        watcher.on('change', (filePath) => {
            console.log(`File changed: ${filePath}`);
            this.fileChangeQueue.push({filePath, repoPath: this.repoPath});
            this.processFileChangeQueue();
        });
    }
}
