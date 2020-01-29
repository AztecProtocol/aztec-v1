import instance from '../utils/instance';
import {
    errorLog,
} from '../utils/log';
import {
    locatePackage,
    locateFile,
} from '../utils/path';

const truffleExec = '.bin/truffle';

export default function migrateContractsInstance({
    packageName,
    onError,
    onClose,
}) {
    const targetPath = locatePackage(packageName);
    if (!targetPath) {
        errorLog(`Unable to run truffle migrate. Package '${packageName}' not found.`);
        if (onError) {
            onError();
        }
    }

    const trufflePath = locateFile(truffleExec);

    if (!trufflePath) {
        errorLog('Truffle not found', `path: ${trufflePath}`);
        if (onError) {
            onError();
        }
    }

    return instance(
        `cd ${targetPath} && ${trufflePath} compile --all && ${trufflePath} migrate --reset`,
        {
            onError,
            onClose,
        },
    );
}
