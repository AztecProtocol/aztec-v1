import Web3Service from '~/helpers/Web3Service';
import {
    ACE,
} from '~config/contracts';

export default async function fetchAssets({
    fromBlock = 'earliest',
    toBlock = 'latest',
    assetAddress = null,
} = {}) {
    const eventName = ACE.events.сreateNoteRegistry;

    const options = {
        fromBlock,
        toBlock,
    };

    if (assetAddress) {
        options.filter = {
            registryOwner: assetAddress,
        };
    }

    try {
            .useContract(ACE.name)
        const data = await Web3Service
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
            },
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
            error,
            assets: null,
        };
    }
}
