import addressModel from '~database/models/address';
import assetModel from '~database/models/asset';
import noteModel from '~database/models/note';
import syncAssetNoteData from './syncAssetNoteData';

export default async function mergeWithLatestAsset(
    userAddress,
    linkedPrivateKey,
    prevAssetNoteDataMappinig,
) {
    const ownerKey = await addressModel.keyOf({
        address: userAddress,
    });
    const lastEntry = await noteModel.last({
        owner: ownerKey,
    });
    if (!lastEntry) {
        return prevAssetNoteDataMappinig;
    }

    const {
        id: assetId,
    } = await assetModel.get({
        key: lastEntry.asset,
    });


    if (prevAssetNoteDataMappinig[assetId]) {
        return prevAssetNoteDataMappinig;
    }

    const assetNoteDataMapping = await syncAssetNoteData(
        userAddress,
        linkedPrivateKey,
        assetId,
    );

    return {
        ...prevAssetNoteDataMappinig,
        [assetId]: assetNoteDataMapping,
    };
}
