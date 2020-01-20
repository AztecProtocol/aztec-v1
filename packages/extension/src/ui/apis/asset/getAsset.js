import BN from 'bn.js';
import Web3Service from '~/helpers/Web3Service';
import assetModel from '~/background/database/models/asset';

export default async function getAsset(assetAddress) {
    const {
        networkId,
    } = Web3Service;
    const {
        registryOwner,
        linkedTokenAddress,
        scalingFactor,
    } = await assetModel.get(
        { networkId },
        { registryOwner: assetAddress },
    ) || {};

    if (!registryOwner) {
        return null;
    }

    return {
        address: registryOwner,
        linkedTokenAddress,
        scalingFactor: new BN(scalingFactor),
    };
}
