import Web3Service from '~/helpers/Web3Service';
import Asset from '~/background/database/models/asset';
import fetchAssetOnChain from './fetchAssetOnChain';

export default async function fetchAsset({
    address,
}) {
    let asset = await Asset.get(
        { networkId: Web3Service.networkId },
        { registryOwner: address },
    );
    let error = null;

    if (!asset) {
        ({
            error,
            asset,
        } = await fetchAssetOnChain({
            address,
        }) || {});
    }
    if (asset
        && asset.registryOwner !== address
    ) {
        // TODO - find out why an asset is returned when the given address is not in indexedDB
        asset = null;
    }

    return {
        error,
        asset: asset
            ? {
                ...asset,
                id: address,
                address,
            }
            : null,
    };
}
