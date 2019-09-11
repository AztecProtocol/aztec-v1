import Web3Service from '~background/services/Web3Service';
import {
    ACEConfig,
} from '~background/config/contracts'
 
export const fetchAssets = async ({
    fromBlock = 'earliest',
    toBlock = 'latest',
    networkId,
} = {}) => {
    if (!networkId) {
        return {
            error: new Error("'networkId' cannot be empty in fetchAssets"),
            assets: null,
        };
    }

    const eventName = ACEConfig.events.сreateNoteRegistry;

    const options = {
        fromBlock, 
        toBlock,
    };

    try {
        //TODO: Add possibility to load form different networks
        const data = await Web3Service
            .useContract(ACEConfig.name)
            .events(eventName)
            .where(options);

        const assets = data.map(({
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

        return { 
            error: null,
            assets,
        };

    } catch (error) {

        return { 
            error: error,
            assets: null
        };
    };
}
