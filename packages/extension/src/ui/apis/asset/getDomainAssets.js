import BN from 'bn.js';
import Web3Service from '~/helpers/Web3Service';
import assetModel from '~/background/database/models/asset';

export default async function getDomainAssets() {
    // TODO - domain should not be able to access all assets by default
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
