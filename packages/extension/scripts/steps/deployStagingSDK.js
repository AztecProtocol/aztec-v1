import deploy from '../tasks/aws/deploy';

export default async function serSdkServeUrl() {
    return deploy.launch([]);
}
