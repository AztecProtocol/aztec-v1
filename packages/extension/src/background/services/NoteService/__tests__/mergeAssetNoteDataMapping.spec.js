import mergeAssetNoteDataMapping from '../utils/mergeAssetNoteDataMapping';

describe('mergeAssetNoteDataMapping', () => {
    it('merge two assetNoteDataMappings', () => {
        const assetNoteDataMapping0 = {
            assetId0: {
                balance: 11,
                noteValues: {
                    1: ['n:0'],
                    5: ['n:1', 'n:2'],
                },
                lastSynced: 'n:2',
            },
        };
        const assetNoteDataMapping1 = {
            assetId0: {
                balance: 5,
                noteValues: {
                    1: ['n:3'],
                    4: ['n:4'],
                },
                lastSynced: 'n:4',
            },
            assetId1: {
                balance: 1,
                noteValues: {
                    1: ['n:5'],
                },
                lastSynced: 'n:5',
            },
        };
        const merged = mergeAssetNoteDataMapping(
            assetNoteDataMapping0,
            assetNoteDataMapping1,
        );
        expect(merged).toEqual({
            assetId0: {
                balance: 16,
                noteValues: {
                    1: ['n:0', 'n:3'],
                    5: ['n:1', 'n:2'],
                    4: ['n:4'],
                },
                lastSynced: 'n:4',
            },
            assetId1: {
                balance: 1,
                noteValues: {
                    1: ['n:5'],
                },
                lastSynced: 'n:5',
            },
        });
    });

    it('will not add the same note value to balance more than once', () => {
        const assetNoteDataMapping0 = {
            assetId0: {
                balance: 11,
                noteValues: {
                    1: ['n:0'],
                    5: ['n:1', 'n:2'],
                },
                lastSynced: 'n:2',
            },
        };
        const assetNoteDataMapping1 = {
            assetId0: {
                balance: 5,
                noteValues: {
                    1: ['n:0', 'n:3'],
                    4: ['n:4'],
                    5: ['n:2', 'n:5'],
                },
                lastSynced: 'n:5',
            },
        };
        const merged = mergeAssetNoteDataMapping(
            assetNoteDataMapping0,
            assetNoteDataMapping1,
        );
        expect(merged).toEqual({
            assetId0: {
                balance: 21,
                noteValues: {
                    1: ['n:0', 'n:3'],
                    4: ['n:4'],
                    5: ['n:1', 'n:2', 'n:5'],
                },
                lastSynced: 'n:5',
            },
        });
    });
});
