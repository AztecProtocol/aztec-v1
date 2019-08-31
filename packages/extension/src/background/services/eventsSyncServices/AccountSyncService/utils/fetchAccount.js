import {
    errorLog,
} from '~utils/log';
import Web3Service from '~background/services/Web3Service';
import {
    AZTECAccountRegistryConfig,
} from '~background/config/contracts'
 
export default async function fetchAccount({
    address,
    fromBlock,
    onError,
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
        fromBlock, 
        toBlock: 'latest'
    };

    try {
        const data = await Web3Service
            .useContract(AZTECAccountRegistryConfig.name)
            .events(eventName)
            .where(options);

        const events = data.map(({
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
        return events;

    } catch (error) {
        onError(error);
        return [];
    };
}
