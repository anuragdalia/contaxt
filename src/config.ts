"use strict";

import * as fs from "fs";
import * as path from "path";
import set from "lodash/set";
import get from "lodash/get";

const CONFIG_FILE_PATH = path.join(__dirname, '..', 'contaxt-config.json');

export default class ConfigManager {

    readonly path: string;
    private readonly config;

    constructor(path: string = CONFIG_FILE_PATH) {
        this.path = path;
        this.config = this.loadConfig();
    }

    private loadConfig(): any {
        if (fs.existsSync(this.path)) {
            const data = fs.readFileSync(this.path, 'utf8');
            return JSON.parse(data);
        }
        return {};
    }

    private saveConfig(): void {
        fs.writeFileSync(this.path, JSON.stringify(this.config, null, 2));
    }

    getKey(key: string): string | null | undefined {
        return get(this.config, key);
    }

    setKey(key: string, value: string | number | boolean): void {
        set(this.config, key, value);
        this.saveConfig();
    }
}
