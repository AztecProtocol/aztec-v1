import {
    errorLog,
} from '~utils/log';
import Web3Service from '~background/services/Web3Service';
import {
    AZTECAccountRegistryConfig,
} from '~config/contracts'
 
export default async function fetchRegisterExtensions({
    address,
    fromBlock,
    onError,
} = {}) {
    if (!address) {
        errorLog("'address' cannot be empty");
        return null;
    }

    const event = {
        eventName: AZTECAccountRegistryConfig.registerExtension,
    };

    const options = {
        filter: {
            account: address
        }, 
        fromBlock, 
        toBlock: 'latest'
    }

    try {
        const data = await Web3Service
            .useContract(AZTECAccountRegistryConfig.name)
            .events({event})
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
        return events
    } catch (error) {
        //TODO: Check error handling
        throw error;
        onError(error);
    }
}
