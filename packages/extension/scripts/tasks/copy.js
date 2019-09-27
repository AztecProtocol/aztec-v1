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
const extensionBackgroundContractsFolder = 'src/background/contracts';

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

    /*
    * Copy Contracts into background folder for syncing events
    */
    const destContractsPath = path.join(projectRoot, extensionBackgroundContractsFolder);
    try {
        ensureDirectory(destContractsPath);

        contractsToCopy
            .map(contractName => ({
                contractName,
                sourcePath: validateContractSrc(contractName),
            }))
            .filter(({ sourcePath }) => sourcePath)
            .forEach(({ contractName, sourcePath }) => {
                promises.push(
                    copyFile(
                        sourcePath,
                        path.join(destContractsPath, `${contractName}.json`),
                    ),
                );
            });
    } catch (error) {
        if (onError) {
            onError(error);
        }
        return;
    }

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
