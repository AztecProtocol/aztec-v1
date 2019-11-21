import Web3Service from '~/helpers/NetworkService';
import {
    ACE,
} from '~config/contractEvents';

export default async function fetchAssetOnChain({
    address,
    networkId,
    fromBlock = 'earliest',
    toBlock = 'latest',
}) {
    const web3Service = await Web3Service({ networkId });
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
        const data = await web3Service
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
        }) => ({
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
