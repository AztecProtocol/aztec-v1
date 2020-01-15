import Web3Service from '~/helpers/Web3Service';
import {
    ACE,
} from '~/config/contractEvents';
import {
    transformAssetFromBlock,
} from '~/utils/transformData';

export default async function fetchAssetOnChain({
    address,
    fromBlock = 'earliest',
    toBlock = 'latest',
}) {
    const options = {
        filter: {
            registryOwner: address,
        },
        fromBlock,
        toBlock,
    };

    let error;
    let asset;
    try {
        const data = await Web3Service
            .useContract('ACE')
            .events(ACE.сreateNoteRegistry)
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

        [asset] = assets || [];
    } catch (e) {
        error = e;
    }

    return {
        error,
        asset,
    };
}
