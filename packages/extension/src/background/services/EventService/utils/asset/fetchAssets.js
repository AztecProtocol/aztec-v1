import Web3Service from '~/helpers/Web3Service';
import {
    ACE,
} from '~/config/contractEvents';
import {
    transformAssetFromBlock,
} from '~/utils/transformData';

export default async function fetchAssets({
    fromBlock = 'earliest',
    toBlock = 'latest',
    assetAddress = null,
} = {}) {
    const eventName = ACE.сreateNoteRegistry;

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
        const data = await Web3Service
            .useContract('ACE')
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
        }) => transformAssetFromBlock({
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
