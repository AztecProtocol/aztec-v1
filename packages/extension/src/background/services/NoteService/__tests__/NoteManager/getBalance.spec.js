import {
    userAccount,
    userAccount2,
} from '~helpers/testUsers';
import * as storage from '~utils/storage';
import NoteManager from '../../helpers/NoteManager';

jest.mock('~utils/storage');

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
    };
});

beforeEach(() => {
    storage.reset();
});

describe('NoteManager.getBalance', () => {
    it('return balance for given assetId', async () => {
        const balance = await manager.getBalance({
            ownerAddress,
            assetId: 'assetId_0',
        });
        expect(balance).toBe(12);
    });

    it('return 0 if asset is not in assetNoteDataMapping', async () => {
        const balance = await manager.getBalance({
            ownerAddress,
            assetId: 'assetId_1',
        });
        expect(balance).toBe(0);
    });

    it('return 0 and log a warning if input address is not the same as current owner', async () => {
        const consoleWarnSpy = jest.spyOn(console, 'warn')
            .mockImplementation(() => jest.fn());

        const balance = await manager.getBalance({
            ownerAddress: userAccount2.address,
            assetId: 'assetId_1',
        });
        expect(balance).toEqual(0);

        expect(consoleWarnSpy).toHaveBeenCalledTimes(1);

        consoleWarnSpy.mockRestore();
    });
});
