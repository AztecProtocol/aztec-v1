import path from 'path';

import {
    locatePackage,
} from '../utils/path';
import serve from '../tasks/http-server/serve';

export default async function serveSDK() {
    const buildFolder = path.resolve(locatePackage('extension'), './build');
    const serveFolder = serve(buildFolder);
    const serveLocation = process.env.SERVE_LOCATION || '';
    const [providedHost, providedPort] = serveLocation.split(':');
    const host = providedHost || 'localhost';
    const port = providedPort || '5555';

    return serveFolder.launch([
        '-p', port,
        '--cors', '--ssl',
        '-C', path.join(path.relative(serveFolder.cwd, locatePackage('extension')), 'localhost.pem'),
        '-K', path.join(path.relative(serveFolder.cwd, locatePackage('extension')), 'localhost-key.pem'),
        '-a', host,
    ]);
}
