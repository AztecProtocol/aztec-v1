import {
    argsError,
} from '~utils/error';
import initAll from './utils/initAll';
import initAssetNoteValues from './utils/initAssetNoteValues';
import pickNotes from './utils/pickNotes';

class NoteService {
    constructor() {
        this.assetNoteValues = {
            /**
             * Structure in assetNoteValues:
             * [ownerAddress]: {
             *     [assetId]: {
             *         balance: Int
             *         noteValues: {
             *             [value]: [NoteKey!],
             *         },
             *         syncing: Boolean,
             *     }
             * }
             */
        };
        this.syncing = false;
    }

    async init() {
        this.syncing = true;
        this.assetNoteValues = await initAll();
        this.syncing = false;
    }

    async initOwnerAsset(assetId, ownerAddress) {
        // should use this if the number of notes becomes too large
        this.syncing = true;

        if (!this.assetNoteValues[ownerAddress]) {
            this.assetNoteValues[ownerAddress] = {};
        } else if (this.assetNoteValues[ownerAddress][assetId]) {
            return;
        }

        this.assetNoteValues[ownerAddress][assetId] = await initAssetNoteValues(
            assetId,
            ownerAddress,
        );

        this.syncing = false;
        // TODO
        // delete least frequently used asset
    }

    safeSet(ownerAddress) {
        let group;
        if (!this.assetNoteValues[ownerAddress]) {
            this.assetNoteValues[ownerAddress] = {};
        }
        group = this.assetNoteValues[ownerAddress];

        return (assetId) => {
            if (!group[assetId]) {
                group[assetId] = {
                    balance: 0,
                    noteValues: [],
                };
            }
            group = group[assetId];

            return (value) => {
                if (!group.noteValues[value]) {
                    group.noteValues[value] = [];
                }

                return (noteKey) => {
                    if (group.noteValues[value].indexOf(noteKey) < 0) {
                        group.balance += value;
                        group.noteValues[value].push(noteKey);
                    }

                    return group;
                };
            };
        };
    }

    safeFind(ownerAddress) {
        return (assetId) => {
            const group = this.assetNoteValues[ownerAddress] || {};
            return group[assetId] || {
                balance: 0,
                noteValues: {},
            };
        };
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
        if (this.syncing) {
            // TODO
            return;
        }

        this.safeSet(ownerAddress)(assetId)(value)(noteKey);
    }

    removeNoteValue({
        assetId,
        ownerAddress,
        value,
        noteKey,
    }) {
        if (this.syncing
            || !this.assetNoteValues[ownerAddress]
            || !this.assetNoteValues[ownerAddress][assetId]
            || !this.assetNoteValues[ownerAddress][assetId][value]
        ) {
            return;
        }

        const noteKeys = this.assetNoteValues[ownerAddress][assetId].noteValues[value];
        const idx = noteKeys.indexOf(noteKey);
        if (idx >= 0) {
            noteKeys.splice(idx, 1);
            if (!noteKeys.length) {
                delete this.assetNoteValues[ownerAddress][assetId].noteValues[value];
            }
            this.assetNoteValues[ownerAddress][assetId].balance -= value;
        }
    }

    async getBalance(ownerAddress, assetId) {
        if (this.syncing) {
            // TODO
            // return a promice and resolve after synced
        }

        return this.safeFind(ownerAddress)(assetId).balance;
    }

    async pick({
        assetId,
        ownerAddress,
        minSum,
        numberOfNotes = 1,
    }) {
        if (this.syncing) {
            // TODO
            // waitInQueue
        }

        const {
            balance,
            noteValues,
        } = this.safeFind(ownerAddress)(assetId);

        if (minSum > balance) {
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
