import { get } from '~/utils/storage';
import {
    SIGNING_PROVIDER,
} from '~config/constants';

export default async () => {
    const apiKey = await get('apiKey');
    const networkId = await get('networkId');
    let hasFreeTransactions = false;
    // we need to check the quota
    if (apiKey) {
        const lambdaResponse = await window.fetch(`${SIGNING_PROVIDER}/Stage/${networkId}/${apiKey}`, {
            method: 'GET', // *GET, POST, PUT, DELETE, etc.
            mode: 'cors', // no-cors, *cors, same-origin
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            credentials: 'same-origin', // include, *same-origin, omit
        });

        const { data } = await lambdaResponse.json();
        ({ hasFreeTransactions } = data);
    }

    return !!apiKey && hasFreeTransactions;
};
