import fs from 'fs';
import path from 'path';

export const isDirectory = (dest) => {
    try {
        const stats = fs.statSync(dest);
        return stats.isDirectory();
    } catch (error) {
        return false;
    }
};

export const isFile = (dest) => {
    try {
        const stats = fs.statSync(dest);
        return stats.isFile();
    } catch (error) {
        return false;
    }
};

export const ensureDirectory = (dest) => {
    if (!isDirectory(dest)) {
        fs.mkdirSync(dest, {
            recursive: true,
        });
    }
};

export const safeReadFileSync = (filePath, encode = 'utf8') => {
    try {
        const files = fs.readFileSync(filePath, encode);
        return files || [];
    } catch (error) {
        return [];
    }
};

export const copyFile = (src, dest) => new Promise((resolve) => {
    const readStream = fs.createReadStream(src);

    readStream.on('error', error => resolve({
        error,
        src,
        dest,
    }));

    readStream.on('end', () => resolve({
        src,
        dest,
    }));

    readStream.pipe(fs.createWriteStream(dest));
});

export const copyFolder = (src, dest, overwrite = false) => new Promise(async (resolve) => {
    ensureDirectory(dest);
    await Promise.all(fs.readdirSync(src)
        .map((name) => {
            const srcPath = path.join(src, name);
            const destPath = path.join(dest, name);
            if (isDirectory(srcPath)) {
                return copyFolder(srcPath, destPath);
            }

            if (!overwrite && isFile(destPath)) {
                return null;
            }

            return copyFile(srcPath, destPath);
        })
        .filter(p => p));

    resolve({
        src,
        dest,
    });
});
