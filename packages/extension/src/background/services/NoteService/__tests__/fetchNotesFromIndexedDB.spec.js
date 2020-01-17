import 'fake-indexeddb/auto';
import {
    randomId,
    randomInt,
} from '~/utils/random';
import fetchNotesFromIndexedDB from '../utils/fetchNotesFromIndexedDB';
import * as note from '~/background/database/models/note';

const networkId = randomId();
const ownerAddress = randomId();

const addNote = async (note) => {
    await Note.add(note, {
        networkId,
    });
};

describe('fetchNotesFromIndexedDB', () => {
    const assetA = randomId();
    const assetB = randomId();
    const sourceNotesA = [...Array(20)].map(() => ({
        owner: ownerAddress,
        asset: assetA,
        noteHash: randomId(),
        viewingKey: randomId(),
        blockNumber: randomInt(10000),
    }));
    const sourceNotesB = [...Array(10)].map(() => ({
        owner: ownerAddress,
        asset: assetB,
        noteHash: randomId(),
        viewingKey: randomId(),
        blockNumber: randomInt(10000),
    }));
    const sortedBlockNumbersA = sourceNotesA
        .map(({ blockNumber }) => blockNumber)
        .sort((a, b) => a - b);
    const sortedBlockNumbersB = sourceNotesB
        .map(({ blockNumber }) => blockNumber)
        .sort((a, b) => a - b);
    const sortedBlockNumbers = [
        ...sortedBlockNumbersA,
        ...sortedBlockNumbersB,
    ].sort((a, b) => a - b);

    beforeAll(async () => {
        await Promise.all(sourceNotesA.map(async note => addNote(note)));
        await Promise.all(sourceNotesB.map(async note => addNote(note)));
    });

    it('return certain amount of notes whose blockNumber is in range', async () => {
        const notes = await fetchNotesFromIndexedDB(networkId, ownerAddress, {
            count: 3,
            fromBlockNumber: sortedBlockNumbers[3],
            toBlockNumber: sortedBlockNumbers[8],
        });
        expect(notes.map(({ blockNumber }) => blockNumber))
            .toEqual(sortedBlockNumbers.slice(4, 7));
    });

    it('return certain amount of notes for a given asset', async () => {
        const notes = await fetchNotesFromIndexedDB(networkId, ownerAddress, {
            assetId: assetA,
            count: 3,
        });
        expect(notes.map(({ blockNumber }) => blockNumber))
            .toEqual(sortedBlockNumbersA.slice(0, 3));
    });

    it('return certain amount of notes for a given asset whose blockNumber is in range', async () => {
        const notes = await fetchNotesFromIndexedDB(networkId, ownerAddress, {
            assetId: assetA,
            count: 3,
            fromBlockNumber: sortedBlockNumbersA[3],
            toBlockNumber: sortedBlockNumbersA[8],
        });
        expect(notes.map(({ blockNumber }) => blockNumber))
            .toEqual(sortedBlockNumbersA.slice(4, 7));
    });

    it('return empty array if no notes match the requirement', async () => {
        const notes = await fetchNotesFromIndexedDB(networkId, ownerAddress, {
            assetId: randomId(),
            count: 3,
        });
        expect(notes).toEqual([]);
    });
});
