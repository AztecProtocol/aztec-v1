import path from 'path';
import {
    successLog,
    errorLog,
    logEntries,
} from '../../utils/log';
import {
    projectRoot,
    locatePackage,
} from '../../utils/path';
import {
    isDirectory,
    ensureDirectory,
    copyFolder,
} from '../../utils/fs';

const sourcePackage = 'protocol';
const sourceFolder = 'build/contracts';
const destFolder = 'build/contracts';

export default function copyContracts({
    onError,
    onClose,
} = {}) {
    const packagePath = locatePackage(sourcePackage);
    if (!packagePath) {
        errorLog(`Cannot locate package "${sourcePackage}".`);
        onError();
        return;
    }

    const contractsPath = path.join(packagePath, sourceFolder);
    if (!isDirectory(contractsPath)) {
        errorLog('Cannot find source contracts', contractsPath);
        onError();
        return;
    }

    const destPath = path.join(projectRoot, destFolder);
    ensureDirectory(destPath);

    copyFolder(contractsPath, destPath);

    successLog('Successfully copied contracts!');
    logEntries([`${sourcePackage} > ${destFolder}`]);

    onClose();
}
