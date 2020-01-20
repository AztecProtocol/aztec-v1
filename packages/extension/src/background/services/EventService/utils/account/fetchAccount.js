import Web3Service from '~/helpers/Web3Service';
import {
    AZTECAccountRegistry,
} from '~/config/contractEvents';

export default async function fetchAccount({
    address,
} = {}) {
    if (!address) {
        return {
            error: new Error("'address' cannot be empty in fetchAccount"),
            account: null,
        };
    }

    const eventName = AZTECAccountRegistry.registerExtension;

    const options = {
        filter: {
            account: address,
        },
        fromBlock: 'earliest',
        toBlock: 'latest',
    };

    try {
        // if we try to find `RegisterExtension` event with an address in the filter
        // and there is no account on chain for that address
        // it will break the next transaction sent via GSN
        const onChainLinkedPublicKey = await Web3Service
            .useContract('AZTECAccountRegistry')
            .method('accountMapping')
            .call(address);

        let data = [];
        if (onChainLinkedPublicKey) {
            data = await Web3Service
                .useContract('AZTECAccountRegistry')
                .events(eventName)
                .where(options);
        }

        const accounts = data.map(({
            blockNumber,
            returnValues: {
                linkedPublicKey,
                spendingPublicKey,
            },
        }) => ({
            address,
            blockNumber,
            linkedPublicKey,
            spendingPublicKey,
        }));

        const account = accounts.length ? accounts[accounts.length - 1] : null;

        return {
            error: null,
            account,
        };
    } catch (error) {
        return {
            error,
            account: null,
        };
    }
}
