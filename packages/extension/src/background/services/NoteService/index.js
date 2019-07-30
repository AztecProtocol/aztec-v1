import {
    argsError,
} from '~utils/error';
import initAssetNoteValues from './utils/initAssetNoteValues';
import pickNotes from './utils/pickNotes';

class NoteService {
    constructor() {
        this.assetNoteValues = {
            /**
             * Structure in assetNoteValues:
             * [ownerAddress]: {
             *     [assetId]: {
             *         maxSum: Int
             *         noteValues: {
             *             [value]: [NoteKey!],
             *         },
             *     }
             * }
             */
        };
    }

    async init(assetId, ownerAddress) {
        if (!this.assetNoteValues[ownerAddress]) {
            this.assetNoteValues[ownerAddress] = {};
        } else if (this.assetNoteValues[ownerAddress][assetId]) {
            return;
        }

        this.assetNoteValues[ownerAddress][assetId] = await initAssetNoteValues(
            assetId,
            ownerAddress,
        );
        // TODO
        // delete least frequently used asset
    }

    removeOwner(ownerAddress) {
        // TODO
        // call this to clear the whole assetNoteValues when switching user
        delete this.assetNoteValues[ownerAddress];
    }

    addNoteValue({
        assetId,
        ownerAddress,
        value,
        noteKey,
    }) {
        if (!this.assetNoteValues[ownerAddress]
            || !this.assetNoteValues[ownerAddress][assetId]
        ) {
            return;
        }

        const noteKeys = this.assetNoteValues[ownerAddress][assetId][value];
        if (!noteKeys) {
            this.assetNoteValues[ownerAddress][assetId][value] = [];
        } else if (noteKeys.indexOf(noteKey) >= 0) {
            return;
        }

        noteKeys.push(noteKey);
    }

    removeNoteValue({
        assetId,
        ownerAddress,
        value,
        noteKey,
    }) {
        if (!this.assetNoteValues[ownerAddress]
            || !this.assetNoteValues[ownerAddress][assetId]
            || !this.assetNoteValues[ownerAddress][assetId][value]
        ) {
            return;
        }

        const noteKeys = this.assetNoteValues[ownerAddress][assetId][value];
        const idx = noteKeys.indexOf(noteKey);
        if (idx >= 0) {
            noteKeys.splice(idx, 1);
            if (!noteKeys.length) {
                delete this.assetNoteValues[ownerAddress][assetId][value];
            }
        }
    }

    async pick({
        assetId,
        ownerAddress,
        minSum,
        numberOfNotes = 1,
    }) {
        await this.init(assetId, ownerAddress);
        const {
            maxSum,
            noteValues,
        } = this.assetNoteValues[ownerAddress][assetId];
        if (minSum > maxSum) {
            throw argsError('note.pick.sum', {
                messageOptions: {
                    value: minSum,
                },
            });
        }

        return pickNotes({
            noteValues,
            minSum,
            count: numberOfNotes,
        });
    }
}

export default new NoteService();
