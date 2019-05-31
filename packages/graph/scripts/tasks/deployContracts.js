import path from 'path';
import instance from '../utils/instance';
import {
    errorLog,
} from '../utils/log';
import {
    isDirectory,
    isFile,
} from '../utils/fs';

const modulePath = path.resolve(__dirname, '../../node_modules/@aztec/protocol');
const rootPath = path.resolve(__dirname, '../../../../node_modules/@aztec/protocol');
const truffleFile = 'node_modules/.bin/truffle';

export default function migrate({
    onError,
    onClose,
} = {}) {
    const targetPath = [
        modulePath,
        rootPath,
    ].find(p => isDirectory(p));

    if (!targetPath) {
        errorLog('Protocol files not found');
        if (onError) {
            onError();
        }
        return;
    }

    const trufflePath = path.join(targetPath, truffleFile);

    if (!isFile(trufflePath)) {
        errorLog('Truffle not found', `path: ${trufflePath}`);
        if (onError) {
            onError();
        }
        return;
    }

    instance(
        `cd ${targetPath} && ./${truffleFile} migrate --reset`,
        {
            onError,
            onClose,
        },
    );
}
