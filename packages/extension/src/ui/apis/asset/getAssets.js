import BN from 'bn.js';
import Web3Service from '~/helpers/Web3Service';
import assetModel from '~/background/database/models/asset';

export default async function getAssets() {
    const { networkId } = Web3Service;
    const rawAssets = await assetModel.query({ networkId })
        .toArray();

    return rawAssets.map(({
        registryAddress,
        linkedTokenAddress,
        scalingFactor,
    }) => ({
        address: registryAddress,
        linkedTokenAddress,
        scalingFactor: new BN(scalingFactor),
    }));
}
