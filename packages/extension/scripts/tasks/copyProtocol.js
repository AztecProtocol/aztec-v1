import path from 'path';
import chalk from 'chalk';
import {
    isDirectory,
    copyFolder,
} from '../utils/fs';
import {
    projectRoot,
} from '../utils/path';
import {
    logEntries,
    successLog,
    errorLog,
} from '../utils/log';

const srcContractsFolder = 'build/contracts';
const destContractsFolder = 'build/protocol';

export default async function copyProtocol({
    onError,
    onClose,
} = {}) {
    const srcContractsPath = path.join(projectRoot, srcContractsFolder);
    if (!isDirectory(srcContractsPath)) {
        errorLog('Please run migration first.');
        if (onError) {
            onError();
        }
        return;
    }

    const destContractsPath = path.join(projectRoot, destContractsFolder);

    const result = await Promise.all([
        copyFolder(
            srcContractsPath,
            destContractsPath,
        ),
    ]);
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
