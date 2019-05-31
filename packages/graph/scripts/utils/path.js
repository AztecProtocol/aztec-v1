import path from 'path';
import graphNodeConfig from '../../config/graphNode';
import {
    isDirectory,
} from './fs';

const projectRoot = path.resolve(__dirname, '../../');
const highestLevel = 2;

const {
    manifest: manifestFilename,
} = graphNodeConfig;
const manifestPath = path.join(projectRoot, manifestFilename);

const prettyPath = composedPath =>
    composedPath.replace(/\/{1,}/g, '/');

const locateModule = (name) => {
    const dir = [...Array(highestLevel + 1)]
        .map((_, i) => '../'.repeat(i))
        .find(r => isDirectory(path.join(projectRoot, r, 'node_modules', name)));

    if (dir === undefined) {
        return '';
    }

    const root = path.join(projectRoot, dir);

    return path.join(root, 'node_modules', name);
};

export {
    manifestPath,
    prettyPath,
    projectRoot,
    locateModule,
};
