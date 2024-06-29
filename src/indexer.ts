"use strict";

import * as fs from "fs";
import * as path from "path";
import * as glob from "glob";
import ignore, {Ignore} from "ignore";
import {LocalIndex} from "vectra";
import {computeFileHash, saveFileHash, isFileIndexed} from "./hash";
import ConfigManager from "./config";
import {OpenAIManager} from "./api";

export type VectraResult = {
    score: number;
    path: string;
    text: string;
    explanation: string;
};

export class Indexer {
    private ai: OpenAIManager;
    private readonly index: LocalIndex;
    private readonly repoPath: string;
    ig: Ignore;

    constructor(config: ConfigManager, ai: OpenAIManager) {
        this.ai = ai;
        const repoPath = config.getKey("repoPath");
        if (!repoPath) {
            throw new Error("RepoPath broken?");
        }
        this.repoPath = repoPath;
        this.index = new LocalIndex(path.join(this.repoPath, '.index'), 'files');
        this.ig = this.loadFilesToIgnore(this.repoPath);
    }

    private loadFilesToIgnore(repoPath: string): Ignore {
        const ig = ignore().add('.index').add('.hashes');
        const loadFile = (ignoreFileName: string) => {
            const ignoreFilePath = path.join(repoPath, ignoreFileName);
            if (!fs.existsSync(ignoreFilePath)) return;
            const ignoreFileContent = fs.readFileSync(ignoreFilePath, 'utf8');
            ig.add(ignoreFileContent);
        };
        loadFile('.gitignore');
        loadFile('.contaxtignore');
        return ig;
    }

    private chunkContent(content: string): string[] {
        const lines = content.split('\n');
        const chunks: string[] = [];
        let currentChunk: string[] = [];
        for (const line of lines) {
            currentChunk.push(line);
            if (/^\s*(def|class|function|public|private|protected|if|for|while|switch|import|export|return)\b/.test(line)
                && currentChunk.length > 10) {
                chunks.push(currentChunk.join('\n'));
                currentChunk = [];
            }
        }
        if (currentChunk.length) {
            chunks.push(currentChunk.join('\n'));
        }
        return chunks;
    }

    private async addItem(relativePath: string, content: string, parentContent?: string): Promise<void> {
        const explanation = await this.ai.queryGPTIndexing(content, parentContent);
        const contentToVectorize = `File Path: ${relativePath}\nContent Description: ${explanation}\nFile Content: ${content}`;
        const vector = await this.ai.getVector(contentToVectorize);
        await this.index.insertItem({
            vector,
            metadata: {path: relativePath, text: content, explanation: explanation},
        });
    }

    async indexFile(relativePath: string): Promise<void> {
        const file = path.join(this.repoPath, relativePath);
        const content = fs.readFileSync(file, 'utf8')
            .replace(/data:image\/[^;]+;[^)]+/g, "placeholder-image");
        const items = await this.index.listItemsByMetadata({path: relativePath});
        await this.index.beginUpdate();
        for (const item of items) {
            await this.index.deleteItem(item.id);
        }
        await this.index.endUpdate();
        const chunks = this.chunkContent(content);
        for (const chunk of chunks) {
            console.log(`indexing a chunk of ${relativePath}`);
            await this.addItem(relativePath, chunk, content);
        }
        console.log(`indexing the file at ${relativePath}`);
        await this.addItem(relativePath, content);
        const hash = computeFileHash(file);
        saveFileHash(this.repoPath, relativePath, hash);
    }

    async indexRepository(): Promise<void> {
        if (!await this.index.isIndexCreated()) {
            await this.index.createIndex();
        }
        const files = glob.sync(`${this.repoPath}/**/*`, {nodir: true});
        for (const file of files) {
            const relativePath = path.relative(this.repoPath, file);
            if (this.ig.ignores(relativePath)) {
                continue;
            }
            if (isFileIndexed(this.repoPath, relativePath)) {
                console.log(`skipping ${relativePath}: already indexed`);
                continue;
            }
            console.log(`indexing ${relativePath}`);
            await this.indexFile(relativePath);
        }
    }

    async queryVectra(query: string): Promise<VectraResult[]> {
        const vector = await this.ai.getVector(query);
        const results = await this.index.queryItems(vector, 5);
        return results.map(result => ({
            score: result.score,
            path: result.item.metadata['path'] as string,
            text: result.item.metadata['text'] as string,
            explanation: result.item.metadata['explanation'] as string,
        }));
    }
}
