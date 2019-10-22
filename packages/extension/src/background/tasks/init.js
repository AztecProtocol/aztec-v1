/* global chrome */
import {
    set,
    onIdle,
} from '~utils/storage';
import domainModel from '../../database/models/domain';
import configureWeb3Networks from '~utils/configureWeb3Networks';


export default async function init() {
    if (process.env.NODE_ENV !== 'production') {
        // chrome.storage.local.clear();

        await set({
            __providerUrl: 'https://rinkeby.infura.io/v3/09c4eed231c840d5ace14ba5389a1a7c',
            __infuraProjectId: '09c4eed231c840d5ace14ba5389a1a7c',
        });

        await domainModel.set(
            {
                domain: window.location.origin,
            },
            {
                ignoreDuplicate: true,
            },
        );

        onIdle(
            async () => {
                await set({
                    __sync: 0,
                });
                console.log('--- database idle ---');
                chrome.storage.local.getBytesInUse(null, (bytes) => {
                    console.log('getBytesInUse', bytes);
                });
                chrome.storage.local.get(null, data => console.info(data));
            },
            {
                persistent: true,
            },
        );
    }


    await configureWeb3Networks();
    console.log('____CONFIGURED');
}
