"use strict";

import { promptQuery, promptSaveToFile, promptFilePath, promptContinueQuery } from "./prompts";
import Watcher from "./watcher";
import * as fs from "fs";
import * as path from "path";
import { Indexer } from "./indexer";
import { OpenAIManager } from "./api";
import ConfigManager from "./config";

export default async function chat(config: ConfigManager): Promise<void> {
    const repoPath = config.getKey("repoPath");
    if (!repoPath) {
        throw new Error("RepoPath broken?");
    }
    const ai = new OpenAIManager(process.env["OPENAI_API_KEY"] as string);
    const indexer = new Indexer(config, ai);
    console.log(`Indexing repository at ${repoPath}...`);
    await indexer.indexRepository();
    console.log('Repository indexed successfully.');
    const watcher = new Watcher(config, indexer);
    watcher.watchProject();
    let continueChat = true;
    while (continueChat) {
        const query = await promptQuery();
        const vectraResults = await indexer.queryVectra(query);
        console.log(vectraResults.map((a, i) => `${i + 1}: ${a.path}\n${a.explanation}`).join("\n\n"));
        const gptResponse = await ai.queryGPT(query, vectraResults);
        console.log("=>", gptResponse);
        const saveToFile = await promptSaveToFile();
        if (saveToFile) {
            const filePath = await promptFilePath();
            const finalFile = path.join(repoPath, filePath);
            const fPath = path.dirname(finalFile);
            if (!fs.existsSync(fPath)) {
                fs.mkdirSync(fPath, { recursive: true });
            }
            fs.writeFileSync(finalFile, `${gptResponse}`);
            console.log(`Results saved to ${filePath}`);
        }
        continueChat = await promptContinueQuery();
    }
}
