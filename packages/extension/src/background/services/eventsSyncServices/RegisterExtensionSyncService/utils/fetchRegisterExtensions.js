import {
    errorLog,
} from '~utils/log';
import Web3Service from '~background/services/Web3Service';
import {
    AZTECAccountRegistryConfig,
} from '~config/contracts'
 
export default async function fetchRegisterExtensions({
    address,
    fromBlock: lastSyncedBlock,
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
        fromBlock: lastSyncedBlock, 
        toBlock: 'latest'
    }

    try {
        const data = await Web3Service
            .useContract(AZTECAccountRegistryConfig.name)
            .events({event})
            .where(options);

        const accounts = data.map(({
            blockNumber,
            linkedPublicKey,
            registeredAt,
        }) => ({
            address,
            blockNumber,
            linkedPublicKey,
            registeredAt,
        }));
        return accounts.length > 0 ? accounts[accounts.length - 1] : null
    } catch (error) {
        //TODO: Check error handling
        throw error;
        onError(error);
    }
}
