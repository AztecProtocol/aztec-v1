import {
    errorLog,
} from '~utils/log';
import Web3Service from '~background/services/Web3Service';
import {
    ACEConfig,
} from '~background/config/contracts'
 
export default async function fetchCreateNoteRegistries({
    //TODO: networkId feature is not implemented yet
    networkId,
    fromBlock,
    onError,
} = {}) {
    if (networkId === undefined) {
        errorLog("'networkId' cannot be empty");
        return [];
    };

    const event = {
        eventName: ACEConfig.сreateNoteRegistry,
    };

    const options = {
        fromBlock, 
        toBlock: 'latest'
    };

    try {
        const data = await Web3Service
            .useContract(ACEConfig.name)
            .events({event})
            .where(options);

        const events = data.map(({
            blockNumber,
            returnValues: {
                registryOwner,
                registryAddress,
                scalingFactor,
                linkedTokenAddress,
                canAdjustSupply,
                canConvert,
            }
        }) => ({
            blockNumber,
            registryOwner,
            registryAddress,
            scalingFactor,
            linkedTokenAddress,
            canAdjustSupply,
            canConvert,
        }));
        return events || [];

    } catch (error) {
        onError(error);
        return [];
    };
}
