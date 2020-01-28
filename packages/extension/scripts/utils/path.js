import path from 'path';
import {
    isDirectory,
    isFile,
} from './fs';

const projectRoot = path.resolve(__dirname, '../../');
const highestLevel = 2;


const prettyPath = composedPath => composedPath.replace(/\/{1,}/g, '/');

const locateModule = (name, isFileType = false) => {
    const validator = isFileType ? isFile : isDirectory;

    const dir = [...Array(highestLevel + 1)]
        .map((_, i) => '../'.repeat(i))
        .find(r => validator(path.join(projectRoot, r, 'node_modules', name)));
    if (dir !== undefined) {
        return path.join(projectRoot, dir, 'node_modules', name);
    }

    const moduleDir = [...Array(highestLevel + 1)]
        .map((_, i) => '../'.repeat(i))
        .find(r => validator(path.join(projectRoot, r, 'node_modules/@aztec', name)));
    if (moduleDir !== undefined) {
        return path.join(projectRoot, moduleDir, 'node_modules/@aztec', name);
    }

    return '';
};

const locatePackage = (name) => {
    const packageDir = [...Array(highestLevel + 1)]
        .map((_, i) => '../'.repeat(i))
        .find(r => isDirectory(path.join(projectRoot, r, 'packages', name)));
    if (packageDir !== undefined) {
        return path.join(projectRoot, packageDir, 'packages', name);
    }

    return locateModule(name);
};

const locateFile = name => locateModule(name, true);

export {
    prettyPath,
    projectRoot,
    locateModule,
    locatePackage,
    locateFile,
};
