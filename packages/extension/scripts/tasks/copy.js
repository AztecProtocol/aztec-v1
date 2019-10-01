import path from 'path';
import chalk from 'chalk';
import {
    ensureDirectory,
    copyFile,
    isFile,
} from '../utils/fs';
import {
    projectRoot,
} from '../utils/path';
import {
    logEntries,
    successLog,
    errorLog,
} from '../utils/log';

const contractsToCopy = [
    'AZTECAccountRegistry',
    'ACE',
    'IZkAsset',
];

const srcContractsFolder = 'build/contracts';

const validateContractSrc = (contractName) => {
    const srcPath = path.join(projectRoot, srcContractsFolder, `${contractName}.json`);

    if (!isFile(srcPath)) {
        errorLog(`Contract '${contractName}' does not exist.`);
        return '';
    }

    return srcPath;
};

export default async function copy({
    onError,
    onClose,
} = {}) {
    const promises = [];

    const result = await Promise.all(promises);
    const copiedMessages = [];
    let successCopies = 0;
    result.forEach(({
        error,
        src,
        dest,
    }) => {
        if (error) {
            copiedMessages.push(`${chalk.red('✖')} ${src} ➔  ${dest}`);
        } else {
            successCopies += 1;
            copiedMessages.push(`  ${src} ➔  ${dest}`);
        }
    });

    logEntries(copiedMessages);
    successLog(`${successCopies} files/folders copied.`);

    if (onClose) {
        onClose();
    }
}
