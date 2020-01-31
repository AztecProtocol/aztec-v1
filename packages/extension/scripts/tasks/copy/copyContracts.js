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
} from '../../utils/fs';
import instance from '../../utils/instance';

const sourcePackage = 'protocol';
const folderName = 'contracts';
const sourceFolder = 'build';
const destFolder = 'build';

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

    const contractsPath = path.join(packagePath, `${sourceFolder}/${folderName}`);
    if (!isDirectory(contractsPath)) {
        errorLog('Cannot find source contracts', contractsPath);
        onError();
        return;
    }

    const destPath = path.join(projectRoot, destFolder);

    instance(
        `cp -r ${contractsPath} ${destPath}`,
        {
            onError,
            onClose: () => {
                successLog('\nSuccessfully copied contracts!');
                logEntries([`${sourcePackage} > ${destFolder}/${folderName}`]);
                onClose();
            },
        },
    );
}
