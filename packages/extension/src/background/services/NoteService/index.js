import {
    warnLog,
} from '~utils/log';
import NoteManager from './helpers/NoteManager';

const manager = new NoteManager();

export default {
    init: () => warnLog('NoteService.init() is deprecated. Use NoteService.initWithUser(ownerAddress, linkedPrivateKey, linkedPublicKey) instead.'),
    initWithUser: async (ownerAddress, linkedPrivateKey, linkedPublicKey, networkId) => manager.init(
        ownerAddress,
        linkedPrivateKey,
        linkedPublicKey,
        networkId,
    ),
    switchUser: async (ownerAddress, linkedPrivateKey, linkedPublicKey, networkId) => {
        if (ownerAddress === manager.ownerAddress) return;
        await manager.init(
            ownerAddress,
            linkedPrivateKey,
            linkedPublicKey,
            networkId,
        );
    },
    save: async () => manager.save(),
    syncAsset: async (
        ownerAddress,
        assetId,
    ) => manager.syncAsset({
        ownerAddress,
        assetId,
    }),
    addNoteValue: async (
        ownerAddress,
        assetId,
        value,
        noteKey,
    ) => manager.ensureSynced(
        'addNoteValue',
        {
            ownerAddress,
            assetId,
            value,
            noteKey,
        },
    ),
    removeNoteValue: async (
        ownerAddress,
        assetId,
        value,
        noteKey,
    ) => manager.ensureSynced(
        'removeNoteValue',
        {
            ownerAddress,
            assetId,
            value,
            noteKey,
        },
    ),
    getBalance: async (
        ownerAddress,
        assetId,
    ) => manager.ensureSynced(
        'getBalance',
        {
            ownerAddress,
            assetId,
        },
    ),
    pick: async (
        ownerAddress,
        assetId,
        minSum,
        {
            numberOfNotes = 1,
            allowLessNumberOfNotes = true,
        } = {},
    ) => manager.ensureSynced(
        'pick',
        {
            assetId,
            ownerAddress,
            minSum,
            numberOfNotes,
            allowLessNumberOfNotes,
        },
    ),
};
