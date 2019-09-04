import syncAssetNoteData from './syncAssetNoteData';
import mergeAssetNoteDataMapping from './mergeAssetNoteDataMapping';

export default async function mergeRecoveredWithStorage(
    userAddress,
    linkedPrivateKey,
    prevAssetNoteDataMappinig,
) {
    const assetNoteDataMapping = {};

    await Promise.all(Object.keys(prevAssetNoteDataMappinig).map(async (assetId) => {
        const {
            lastSynced: prevLastSynced,
        } = prevAssetNoteDataMappinig[assetId];

        assetNoteDataMapping[assetId] = await syncAssetNoteData(
            userAddress,
            linkedPrivateKey,
            assetId,
            prevLastSynced,
        );
    }));

    return mergeAssetNoteDataMapping(
        prevAssetNoteDataMappinig,
        assetNoteDataMapping,
    );
}
