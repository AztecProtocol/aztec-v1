import Web3Service from '~/helpers/Web3Service';
import assetModel from '~/background/database/models/asset';

export default async function getLinkedTokenAddress(assetAddress) {
    const {
        networkId,
    } = Web3Service;
    const {
        registryOwner,
        linkedTokenAddress,
    } = await assetModel.get(
        { networkId },
        { registryOwner: assetAddress },
    ) || {};

    return (registryOwner === assetAddress && linkedTokenAddress) || '';
}
