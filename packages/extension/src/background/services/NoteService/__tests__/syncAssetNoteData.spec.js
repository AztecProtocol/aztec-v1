import notes from '~helpers/testNotes';
import {
    userAccount,
    userAccount2,
} from '~helpers/testData';
import * as storage from '~utils/storage';
import {
    toCode,
} from '~utils/noteStatus';
import {
    randomId,
} from '~utils/random';
import asyncForEach from '~utils/asyncForEach';
import noteModel from '~database/models/note';
import assetModel from '~database/models/asset';
import addressModel from '~database/models/address';
import syncAssetNoteData from '../utils/syncAssetNoteData';

jest.setTimeout(10 * 1000);

jest.mock('~utils/storage');

afterEach(() => {
    storage.reset();
});

describe('syncAssetNoteData', () => {
    let assetKeys = [];
    let ownerKeys = [];
    let noteIndex = 0;

    const assets = [
        randomId(),
        randomId(),
    ];
    const owners = [
        userAccount,
        userAccount2,
    ];

    const {
        address: ownerAddress,
        linkedPrivateKey,
    } = userAccount;

    const addNormalNote = async ({
        asset = assetKeys[0],
        owner = ownerKeys[0],
    } = {}) => {
        const note = {
            ...notes[noteIndex],
            asset,
            owner,
            status: toCode('CREATED'),
        };
        noteIndex += 1;
        const {
            key,
        } = await noteModel.set(note);
        return {
            ...note,
            key,
        };
    };

    const addDestroyedNote = async ({
        asset = assetKeys[0],
        owner = ownerKeys[0],
    } = {}) => {
        const note = {
            ...notes[noteIndex],
            asset,
            owner,
            status: toCode('DESTROYED'),
        };
        noteIndex += 1;
        const {
            key,
        } = await noteModel.set(note);
        return {
            ...note,
            key,
        };
    };

    const getBalance = noteArr => noteArr.reduce((accum, { value }) => accum + value, 0);

    const getNoteValues = noteArr => noteArr.reduce((accum, { value, key }) => {
        const newAccum = { ...accum };
        if (!accum[value]) {
            newAccum[value] = [];
        }
        newAccum[value].push(key);
        return newAccum;
    }, {});

    beforeEach(async () => {
        noteIndex = 0;
        ownerKeys = [];
        assetKeys = [];

        await asyncForEach(owners, async ({
            address,
        }) => {
            const {
                key,
            } = await addressModel.set({
                address,
            });
            ownerKeys.push(key);
        });

        await asyncForEach(assets, async (address) => {
            const {
                key,
            } = await assetModel.set({
                address,
            });
            assetKeys.push(key);
        });
    });

    it('get notes from storage with owner address and asset id', async () => {
        const validNotes = [];
        validNotes.push(await addNormalNote());
        await addNormalNote({
            owner: ownerKeys[1],
        });
        await addNormalNote({
            asset: assetKeys[1],
        });
        validNotes.push(await addNormalNote());
        await addDestroyedNote();
        await addDestroyedNote({
            owner: ownerKeys[1],
        });
        validNotes.push(await addNormalNote());

        const response = await syncAssetNoteData(
            ownerAddress,
            linkedPrivateKey,
            assets[0],
        );
        expect(response).toEqual({
            balance: getBalance(validNotes),
            noteValues: getNoteValues(validNotes),
            lastSynced: validNotes[validNotes.length - 1].key,
        });
    });

    it('get notes from storage after lastSynced', async () => {
        const validNotes = [];
        await addNormalNote();
        const note = await addNormalNote();
        await addDestroyedNote();
        validNotes.push(await addNormalNote());
        await addDestroyedNote();
        validNotes.push(await addNormalNote());

        const {
            balance,
        } = await syncAssetNoteData(
            ownerAddress,
            linkedPrivateKey,
            assets[0],
            note.key,
        );
        const expectedBalance = getBalance(validNotes);
        expect(balance).toBe(expectedBalance);
    });

    it('still return an object even when no notes are in storage', async () => {
        const response = await syncAssetNoteData(
            ownerAddress,
            linkedPrivateKey,
            assets[0],
        );
        expect(response).toEqual({
            balance: 0,
            noteValues: {},
            lastSynced: '',
        });
    });

    it('return an object with max id in storage when no notes belong to the owner or asset', async () => {
        await addNormalNote({
            owner: ownerKeys[1],
        });
        const lastNote = await addNormalNote({
            asset: assetKeys[1],
        });

        const response = await syncAssetNoteData(
            ownerAddress,
            linkedPrivateKey,
            assets[0],
        );
        expect(response).toEqual({
            balance: 0,
            noteValues: {},
            lastSynced: lastNote.key,
        });
    });
});
