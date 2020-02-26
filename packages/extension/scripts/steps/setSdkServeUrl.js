import setServeUrl from '../tasks/utils/template';

export default async function serSdkServeUrl() {
    return setServeUrl.launch(['sdk']);
}
