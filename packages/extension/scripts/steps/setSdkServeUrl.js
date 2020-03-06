import setServeUrl from '../tasks/utils/template';

export default async function serSdkServeUrl() {
    return setServeUrl.launch(['sdk', process.env.SERVE_LOCATION || 'https://localhost:5555/sdk/aztec.js']);
}
