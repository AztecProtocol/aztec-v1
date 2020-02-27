import path from 'path';

import {
    locatePackage,
} from '../utils/path';
import serve from '../tasks/http-server/serve';

export default async function serveTemplate() {
    const harnessFolder = path.resolve(locatePackage('extension'), './test/harness');
    const serveFolder = serve(harnessFolder);

    return serveFolder.launch([
        '-p', '5550',
        '--cors', '--ssl',
        '-C', path.join(path.relative(serveFolder.cwd, locatePackage('extension')), 'localhost.pem'),
        '-K', path.join(path.relative(serveFolder.cwd, locatePackage('extension')), 'localhost-key.pem'),
        '-a', '127.0.0.1',
    ]);
}
