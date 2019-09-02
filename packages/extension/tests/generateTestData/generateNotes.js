/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
import {
    randomInts,
} from '~utils/random';
import encryptedViewingKey from '~utils/encryptedViewingKey';
import {
    createNotes,
    valueOf,
} from '~utils/note';
import {
    userAccount,
} from '../helpers/testData';
import prettyPrint from '../utils/prettyPrint';

const {
    address,
    linkedPublicKey,
    spendingPublicKey,
} = userAccount;

export default async function generateNotes(numberOfNotes = 20) {
    const noteValues = randomInts(numberOfNotes, 1000);
    const aztecNotes = await createNotes(noteValues, spendingPublicKey, address);
    const notes = aztecNotes.map((note) => {
        const realViewingKey = note.getView();
        return {
            hash: note.noteHash,
            realViewingKey,
            viewingKey: encryptedViewingKey(linkedPublicKey, realViewingKey).toHexString(),
            value: valueOf(note),
        };
    });

    const dest = path.resolve(__dirname, '../helpers/testNotes.js');
    const content = [
        `export default ${prettyPrint(notes)};`,
    ].join('\n\n');
    try {
        fs.writeFileSync(dest, `${content.trim()}\n`);
    } catch (error) {
        console.log('Failed to generate viewing keys', error);
    }
}
