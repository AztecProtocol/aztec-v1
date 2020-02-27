import certs from '../tasks/http-server/certs';

export default async function createCertificate() {
    return certs.launch(['"localhost"']);
}
