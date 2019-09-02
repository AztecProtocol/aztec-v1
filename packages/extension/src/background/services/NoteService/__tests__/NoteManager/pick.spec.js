import expectErrorResponse from '~helpers/expectErrorResponse';
import {
    userAccount,
    userAccount2,
} from '~helpers/testUsers';
import * as storage from '~utils/storage';
import * as pickNotes from '../../utils/pickNotes';
import NoteManager from '../../helpers/NoteManager';

jest.mock('~utils/storage');

const pickNotesSpy = jest.spyOn(pickNotes, 'default');

const {
    address: ownerAddress,
} = userAccount;

let manager;

beforeAll(() => {
    manager = new NoteManager();
    manager.owner = {
        address: ownerAddress,
    };
    manager.assetNoteDataMapping = {
        assetId_0: {
            balance: 12,
            noteValues: {
                0: ['n:0'],
                5: ['n:2'],
                7: ['n:1'],
            },
            lastSynced: 'n:8',
        },
        assetId_1: {
            balance: 15,
            noteValues: {
                0: ['n:4'],
                5: ['n:3'],
                10: ['n:5'],
            },
            lastSynced: 'n:10',
        },
    };
});

beforeEach(() => {
    pickNotesSpy.mockClear();
    storage.reset();
});

describe('NoteManager.pick', () => {
    it('return an array of note keys whose sum is larger than minSum for given asset', () => {
        expect(manager.pick({
            ownerAddress,
            assetId: 'assetId_0',
            minSum: 6,
            numberOfNotes: 1,
        })).toEqual([
            'n:1',
        ]);

        expect(pickNotesSpy).toHaveBeenCalledTimes(1);
    });

    it('throw error if minSum is larger than asset balance', () => {
        expectErrorResponse(() => manager.pick({
            ownerAddress,
            assetId: 'assetId_0',
            minSum: 13,
            numberOfNotes: 2,
        })).toBe('note.pick.sum');

        expect(pickNotesSpy).not.toHaveBeenCalled();
    });

    it('throw error if input address is not the same as owner', () => {
        const warnSpy = jest.spyOn(console, 'warn')
            .mockImplementation();

        expectErrorResponse(() => manager.pick({
            ownerAddress: userAccount2.address,
            assetId: 'assetId_0',
            minSum: 2,
            numberOfNotes: 1,
        })).toBe('note.pick.sum');

        expect(pickNotesSpy).not.toHaveBeenCalled();
        expect(warnSpy).toHaveBeenCalledTimes(1);
    });
});
