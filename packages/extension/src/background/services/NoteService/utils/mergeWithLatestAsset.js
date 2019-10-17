import addressModel from '~database/models/address';
import assetModel from '~database/models/asset';
import noteModel from '~database/models/note';
import Note from '~background/database/models/note';
import syncAssetNoteData from './syncAssetNoteData';

export default async function mergeWithLatestAsset(
    userAddress,
    linkedPrivateKey,
    prevAssetNoteDataMappinig,
    networkId,
) {
    // const ownerKey = await addressModel.keyOf({
    //     address: userAddress,
    // });

    const options = {
        filterOptions: {
            // owner: userAddress,
        },
    };
    // console.log({ userAddress });
    const lastEntry = await Note.latest({ networkId }, options);
    // console.log({ lastEntry });
    if (!lastEntry) {
        return prevAssetNoteDataMappinig;
    }

    const assetId = lastEntry.asset;

    if (prevAssetNoteDataMappinig[assetId]) {
        return prevAssetNoteDataMappinig;
    }

    const assetNoteDataMapping = await syncAssetNoteData(
        userAddress,
        linkedPrivateKey,
        assetId,
        lastEntry.noteHash,
        networkId,
    );

    return {
        ...prevAssetNoteDataMappinig,
        [assetId]: assetNoteDataMapping,
    };
}
