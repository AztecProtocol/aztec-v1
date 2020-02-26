import path from 'path';

import {
    locatePackage,
} from '../utils/path';
import serve from '../tasks/http-server/serve';

export default async function serveTemplate() {
    const harnessFolder = path.resolve(locatePackage('extension'), './test/harness');
    const serveFolder = serve(harnessFolder);
    const host = 'localhost';
    const port = '5550';

    return serveFolder.launch([
        '-p', port,
        '--cors', '--ssl',
        '-C', path.join(path.relative(serveFolder.cwd, locatePackage('extension')), 'localhost.pem'),
        '-K', path.join(path.relative(serveFolder.cwd, locatePackage('extension')), 'localhost-key.pem'),
        '-a', host,
    ]);
}
