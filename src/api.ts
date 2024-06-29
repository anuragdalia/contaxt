"use strict";

import {Configuration, OpenAIApi} from "openai";
import {VectraResult} from "./indexer";

export class OpenAIManager {
    private api: OpenAIApi;

    constructor(apiKey: string) {
        const configuration = new Configuration({
            apiKey: apiKey,
        });
        this.api = new OpenAIApi(configuration);
    }

    async getVector(text: string): Promise<number[]> {
        const response = await this.api.createEmbedding({
            model: 'text-embedding-3-small',
            input: text,
        }, {validateStatus: () => true});

        if (response.status === 200) {
            return response.data.data[0].embedding;
        }
        if (response.status === 429) {
            await new Promise(resolve => setTimeout(resolve, 120000));
            return this.getVector(text);
        }
        console.log(`${response.status}\n${response.statusText}\nResponse:${response.data}`);
        return response.data.data[0].embedding;
    }

    async queryGPT(userQuery: string, vectraResults: VectraResult[]): Promise<string> {
        const systemPrompt = `You are a helpful coding assistant. Respond with just clear and concise code and don't give any explanations based on the user's query and the provided context.`;
        const userPrompt = `User Query: ${userQuery}

Project Context: ${vectraResults.map(a => `// ${a.path}\n\n ${a.text}`).join("\n\n")}
`.trim();

        const response = await this.api.createChatCompletion({
            messages: [
                {role: 'system', content: systemPrompt},
                {role: 'user', content: userPrompt},
            ],
            model: 'gpt-4o',
            max_tokens: 2000,
        }, {validateStatus: () => true});

        if (response.status === 200) {
            return response.data.choices[0].message!.content!.trim();
        }
        if (response.status === 429) {
            await new Promise(resolve => setTimeout(resolve, 120000));
            return this.queryGPT(userQuery, vectraResults);
        }
        console.log(`${response.status}\n${response.statusText}\nResponse:${response.data}`);
        return response.data.choices[0].message?.content?.trim() || '';
    }

    async queryGPTIndexing(code: string, parentCode?: string): Promise<string> {
        const systemPrompt = `You are a helpful code explainer. 
Respond with just clear and concise explanation of the code chunk provided to you. 
You maybe optionally provided with the whole file content to better describe the code chunk. 
Make sure the explanation is not more than 4 lines.`;

        const userPrompt = parentCode ? `file: ${parentCode.trim()}\n\n chunk:\`\`\`${code.trim()}\`\`\`` : `code:\n \`\`\`${code.trim()}\`\`\``;

        const response = await this.api.createChatCompletion({
            messages: [
                {role: 'system', content: systemPrompt},
                {role: 'user', content: userPrompt},
            ],
            model: 'gpt-4o',
            max_tokens: 2000,
        }, {validateStatus: () => true});

        if (response.status === 200) {
            return response.data.choices[0].message!.content!.trim();
        }
        if (response.status === 429) {
            await new Promise(resolve => setTimeout(resolve, 120000));
            return this.queryGPTIndexing(code, parentCode);
        }
        console.log(`${response.status}\n${response.statusText}\nResponse:${response.data}`);
        return response.data.choices[0].message?.content?.trim() || '';
    }
}
