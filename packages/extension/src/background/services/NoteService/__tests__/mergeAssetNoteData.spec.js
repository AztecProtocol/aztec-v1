import mergeAssetNoteData from '../utils/mergeAssetNoteData';

describe('mergeAssetNoteData', () => {
    it('merge multiple assetNoteData objects', () => {
        const assetNoteData0 = {
            balance: 11,
            noteValues: {
                1: ['n:0'],
                5: ['n:1', 'n:2'],
            },
            lastSynced: 'n:2',
        };
        const assetNoteData1 = {
            balance: 5,
            noteValues: {
                1: ['n:3'],
                4: ['n:4'],
            },
            lastSynced: 'n:4',
        };
        const assetNoteData2 = {
            balance: 1,
            noteValues: {
                0: ['n:5'],
                1: ['n:6'],
            },
            lastSynced: 'n:6',
        };
        const merged = mergeAssetNoteData(
            assetNoteData0,
            assetNoteData1,
            assetNoteData2,
        );
        expect(merged).toEqual({
            balance: 17,
            noteValues: {
                0: ['n:5'],
                1: ['n:0', 'n:3', 'n:6'],
                5: ['n:1', 'n:2'],
                4: ['n:4'],
            },
            lastSynced: 'n:6',
        });
    });

    it('will not add the same note value to balance more than once', () => {
        const assetNoteData0 = {
            balance: 11,
            noteValues: {
                1: ['n:0'],
                5: ['n:1', 'n:2'],
            },
            lastSynced: 'n:2',
        };
        const assetNoteData1 = {
            balance: 5,
            noteValues: {
                1: ['n:0', 'n:3'],
                4: ['n:4'],
                5: ['n:2', 'n:5'],
            },
            lastSynced: 'n:5',
        };
        const merged = mergeAssetNoteData(
            assetNoteData0,
            assetNoteData1,
        );
        expect(merged).toEqual({
            balance: 21,
            noteValues: {
                1: ['n:0', 'n:3'],
                4: ['n:4'],
                5: ['n:1', 'n:2', 'n:5'],
            },
            lastSynced: 'n:5',
        });
    });

    it('pick the larger value as the new lastSynced', () => {
        const assetNoteData0 = {
            balance: 1,
            noteValues: {
                1: ['n:0'],
            },
            lastSynced: 'n:20',
        };
        const assetNoteData1 = {
            balance: 11,
            noteValues: {
                1: ['n:1'],
                5: ['n:2', 'n:3'],
            },
            lastSynced: 'n:5',
        };
        const merged = mergeAssetNoteData(
            assetNoteData0,
            assetNoteData1,
        );
        expect(merged).toEqual({
            balance: 12,
            noteValues: {
                1: ['n:0', 'n:1'],
                5: ['n:2', 'n:3'],
            },
            lastSynced: 'n:20',
        });
    });

    it('will not break if some of the input assetNoteData is empty', () => {
        const assetNoteData0 = {
            balance: 11,
            noteValues: {
                1: ['n:0'],
                5: ['n:1', 'n:2'],
            },
            lastSynced: 'n:2',
        };

        const merged = mergeAssetNoteData(
            null,
            assetNoteData0,
            {},
        );
        expect(merged).toEqual({
            balance: 11,
            noteValues: {
                1: ['n:0'],
                5: ['n:1', 'n:2'],
            },
            lastSynced: 'n:2',
        });
    });
});
