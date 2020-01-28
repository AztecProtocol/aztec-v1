import path from 'path';
import {
    successLog,
    errorLog,
    logEntries,
} from '../../utils/log';
import {
    projectRoot,
    locateModule,
} from '../../utils/path';
import {
    isDirectory,
    ensureDirectory,
    copyFolder,
} from '../../utils/fs';

const sourceModule = 'eth-contract-metadata';
const destFolder = 'build/sdk/public/tokens';

export default function copyTokenIcons({
    onError,
    onClose,
} = {}) {
    const modulePath = locateModule(sourceModule);
    if (!modulePath) {
        errorLog(`Cannot locate module "${sourceModule}".`);
        onError();
        return;
    }

    const iconsPath = path.join(modulePath, 'images');
    if (!isDirectory(iconsPath)) {
        errorLog('Cannot find source icons', iconsPath);
        onError();
        return;
    }

    const destPath = path.join(projectRoot, destFolder);
    ensureDirectory(destPath);

    copyFolder(iconsPath, destPath);

    successLog('Successfully copied token icons!');
    logEntries([`${sourceModule} > ${destFolder}`]);

    onClose();
}
