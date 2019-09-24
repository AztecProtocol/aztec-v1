import Asset from '~background/database/models/asset';
import EventService from '~background/services/EventService';
import {
    errorLog,
} from '~utils/log';
import metadata from '~utils/metadata';


const packNote = (note, asset, noteAccess) => ({
    account: {
        address: noteAccess.address,
    },
    viewingKey: noteAccess.viewingKey,
    note: {
        hash: note.noteHash,
        asset: {
            address: asset.registryOwner,
            linkedTokenAddress: asset.linkedTokenAddress,
            scalingFactor: asset.scalingFactor,
            canAdjustSupply: asset.canAdjustSupply,
            canConvert: asset.canConvert,
        },
        owner: {
            address: note.owner,
        },
        status: note.status,
    },
});


export default async function fetchNoteFromIndexedDB(options) {
    const {
        noteId: noteHash,
        account,
        networkId,
    } = options;

    if (!account) {
        errorLog("'account' cannot be empty");
        return [];
    }

    const {
        error,
        note: onChainNote,
    } = await EventService.fetchLatestNote({
        noteHash,
        networkId,
    });

    console.log(`onChainNote.asset: ${JSON.stringify(onChainNote)}`);

    let noteAccesses = [];
    if (onChainNote) {
        const asset = await Asset.get({ networkId }, { registryOwner: onChainNote.asset });
        const {
            addresses,
            viewingKeys,
        } = metadata(onChainNote.metadata);

        noteAccesses = addresses.map((address, index) => ({
            address,
            viewingKey: viewingKeys[index],
        })).map(noteAccess => packNote(onChainNote, asset, noteAccess));
    }

    console.log(`fetched latest Note: ${JSON.stringify(onChainNote)}, \n error: ${JSON.stringify(error)} \n noteAccesses: ${JSON.stringify(noteAccesses)}`);

    return noteAccesses.map(({
        note,
        ...rest
    }) => ({
        ...rest,
        ...note,
    }));
}

// export default async function fetchNoteFromServer({
//     account,
//     noteId = '',
//     lastSynced = '',
//     blockNumber = 0,
//     numberOfNotes = 1,
//     excludes = [],
//     onError,
// } = {}) {
//     if (!account) {
//         errorLog("'account' cannot be empty");
//         return [];
//     }

//     const query =  `
//             query($first: Int!, $where: NoteAccess_filter, $orderBy: NoteAccess_orderBy) {
//                 noteAccesses(first: $first, where: $where, orderBy: $orderBy, orderDirection: "desc") {
//                     account {
//                         address
//                     }
//                     viewingKey
//                     note {
//                         hash
//                         asset {
//                             address
//                             linkedTokenAddress
//                             scalingFactor
//                             canAdjustSupply
//                             canConvert
//                         }
//                         owner {
//                             address
//                         }
//                         status
//                     }
//                 }
//             }
//         `;

//     const where = {
//         account,
//         id_gt: lastSynced,
//         id_not_in: excludes,
//         where.note = noteId;
//     };


//     const {
//         noteLogs = [],
//         noteAccesses = [],
//     } = data || {};
