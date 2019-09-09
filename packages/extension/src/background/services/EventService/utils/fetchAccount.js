import {
    errorLog,
} from '~utils/log';
import Web3Service from '~background/services/Web3Service';
import {
    AZTECAccountRegistryConfig,
} from '~background/config/contracts'
 
export default async function fetchAccount({
    address,
} = {}) {
    if (!address) {
        errorLog("'address' cannot be empty");
        return null;
    };

    const eventName = AZTECAccountRegistryConfig.events.registerExtension

    const options = {
        filter: {
            account: address
        },
        fromBlock: 'earliest', 
        toBlock: 'latest',
    };

    try {
        const data = await Web3Service
            .useContract(AZTECAccountRegistryConfig.name)
            .events(eventName)
            .where(options);

        const accounts = data.map(({
            blockNumber,
            returnValues: {
                linkedPublicKey,
                registeredAt,
            }
        }) => ({
            address,
            blockNumber,
            linkedPublicKey,
            registeredAt,
        }));
        return { error: null, accounts };

    } catch (error) {
        return { error, accounts: null}
    };
}
