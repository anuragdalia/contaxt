"use strict";

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

const hashFolder = '.hashes';

export const computeFileHash = (filePath: string): string => {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('MD5');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
};

export const isFileIndexed = (repoPath: string, relativePath: string): boolean => {
    const hash = computeFileHash(path.join(repoPath, relativePath));
    const hashPath = path.join(repoPath, hashFolder, `${relativePath}.hash`);
    if (!fs.existsSync(hashPath)) return false;
    const oldHash = fs.readFileSync(hashPath).toString();
    return hash === oldHash;
};

export const saveFileHash = (repoPath: string, relativePath: string, hash: string): void => {
    const hashPath = path.join(repoPath, hashFolder, `${relativePath}.hash`);
    const fPath = path.dirname(hashPath);
    if (!fs.existsSync(fPath)) {
        fs.mkdirSync(fPath, {recursive: true});
    }
    fs.writeFileSync(hashPath, hash);
};
