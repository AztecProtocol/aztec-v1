import mergeNoteValues from './mergeNoteValues';
import maxNoteKey from './maxNoteKey';
import newAssetNoteData from './newAssetNoteData';
import getBalanceFromNoteValues from './getBalanceFromNoteValues';

const merge = (assetNoteData0, assetNoteData1) => {
    const {
        noteValues: noteValues0 = {},
        lastSynced: lastSynced0,
    } = assetNoteData0 || {};

    const {
        noteValues: noteValues1 = {},
        lastSynced: lastSynced1,
    } = assetNoteData1 || {};

    const noteValues = mergeNoteValues(noteValues0, noteValues1);
    const balance = getBalanceFromNoteValues(noteValues);

    return {
        ...assetNoteData0,
        ...assetNoteData1,
        balance,
        noteValues,
        lastSynced: maxNoteKey(lastSynced1, lastSynced0),
    };
};

export default function mergeAssetNoteData(...assetNoteDataArr) {
    return assetNoteDataArr.reduce((accumAssetNoteData, assetNoteData) => merge(
        accumAssetNoteData,
        assetNoteData,
    ), newAssetNoteData());
}
