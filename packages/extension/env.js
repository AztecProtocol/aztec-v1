import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
}

const { NODE_ENV } = process.env;
const prefix = path.resolve(__dirname, './.env');
const dotenvFiles = [
    `${prefix}.${NODE_ENV}.local`,
    `${prefix}.${NODE_ENV}`,
    prefix,
].filter(Boolean);

dotenvFiles.forEach((dotenvFile) => {
    if (fs.existsSync(dotenvFile)) {
        dotenv.config({ path: dotenvFile });
    }
});
