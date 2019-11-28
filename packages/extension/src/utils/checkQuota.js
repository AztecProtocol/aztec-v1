import { get } from '~/utils/storage';
import {
    SIGNING_PROVIDER,
} from '~config/constants';


export default async () => {
    const apiKey = await get('apiKey');
    const networkId = await get('networkId');
    // we need to check the quota
    const lambdaResponse = await window.fetch(`${SIGNING_PROVIDER}/Stage/${parseInt(networkId)}/${apiKey}`, {

        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
    });

    const {
        data: {
            hasFreeTransactions,
        },
    } = await lambdaResponse.json();

    return hasFreeTransactions;
};
