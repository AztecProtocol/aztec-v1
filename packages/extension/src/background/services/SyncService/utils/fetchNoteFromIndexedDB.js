import Asset from '~background/database/models/asset';
import Note from '~background/database/models/note';
import NoteAccess from '~background/database/models/noteAccess';
import EventService from '~background/services/EventService';
import {
    errorLog,
} from '~utils/log';


const packNote = (note, noteAccess, asset) => ({
    account: {
        address: note.owner,
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


export default async function fetchNoteFromIndexedDB({
    account,
    noteHash,
    networkId,
}) {
    if (!account) {
        errorLog("'account' cannot be empty");
        return [];
    }

    console.log(`before fetchLatestNote noteHash: ${JSON.stringify(noteHash)}, account: ${account}, networkId: ${networkId}`);

    const {
        error,
        onChainNote,
    } = await EventService.fetchLatestNote({
        noteHash,
        networkId,
    });

    console.log(`fetched latest Note: ${JSON.stringify(onChainNote)}`);

    // TODO: Extract NoteAccesses
    const noteAccesses = [];
    
    // if (onChainNote) {
    //     const asset = await Asset.get({ networkId }, onChainNote.asset);
    // }

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
