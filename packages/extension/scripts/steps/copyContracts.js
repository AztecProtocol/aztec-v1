import path from 'path';

import {
    locatePackage,
} from '../utils/path';
import copy from '../tasks/utils/copy';

export default async function copyContracts() {
    const protocolPath = locatePackage('protocol');
    const extensionPath = locatePackage('extension');

    const contractsSrc = path.join(protocolPath, 'build/contracts');
    const contractsDest = path.join(extensionPath, 'build');
    return copy.launch([contractsSrc, contractsDest]);
}
