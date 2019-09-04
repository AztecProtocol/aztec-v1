import mergeAssetNoteData from './mergeAssetNoteData';

const merge = (assetNoteDataMapping0, assetNoteDataMapping1) => {
    const assetNoteData = {};
    Object.keys(assetNoteDataMapping0).forEach((assetId) => {
        assetNoteData[assetId] = mergeAssetNoteData(
            assetNoteDataMapping0[assetId],
            assetNoteDataMapping1[assetId],
        );
    });

    Object.keys(assetNoteDataMapping1)
        .filter(assetId => !assetNoteData[assetId])
        .forEach((assetId) => {
            assetNoteData[assetId] = assetNoteDataMapping1[assetId];
        });

    return assetNoteData;
};

export default function mergeAssetNoteDataMapping(...assetNoteDataMappings) {
    return assetNoteDataMappings.reduce((accumAssetNoteDataMapping, assetNoteDataMapping) => merge(
        accumAssetNoteDataMapping,
        assetNoteDataMapping,
    ), {});
}
