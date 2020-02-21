import certs from '../tasks/http-server/certs';

export default async function installCertificate() {
    return certs.launch(['-install']);
}
