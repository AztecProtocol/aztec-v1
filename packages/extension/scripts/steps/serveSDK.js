import path from 'path';

import {
    locatePackage,
} from '../utils/path';
import serve from '../tasks/http-server/serve';

export default async function serveSDK() {
    const buildFolder = path.resolve(locatePackage('extension'), './build');
    const serveFolder = serve(buildFolder);

    return serveFolder.launch([
        '-p', '5555',
        '--cors', '--ssl',
        '-C', path.join(path.relative(serveFolder.cwd, locatePackage('extension')), 'localhost.pem'),
        '-K', path.join(path.relative(serveFolder.cwd, locatePackage('extension')), 'localhost-key.pem'),
        '-a', '127.0.0.1',
    ]);
}
