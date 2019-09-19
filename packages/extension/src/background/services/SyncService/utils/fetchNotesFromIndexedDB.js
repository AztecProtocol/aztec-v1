import Asset from '~background/database/models/asset';
import Note from '~background/database/models/note';
import NoteAccess from '~background/database/models/noteAccess';
import {
    errorLog,
} from '~utils/log';


const packNote = (note, noteAccess, asset) => ({
    logId: note.noteHash,
    blockNumber: note.blockNumber,
    status: note.status,
    account: {
        address: note.owner,
    },
    noteAccess: {
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
        }
    },
})


export default async function fetchNotesFromIndexedDB({
    account,
    lastSynced,
    networkId,
    onError,
} = {}) {
    if (!account) {
        errorLog("'account' cannot be empty");
        return [];
    }
    const networkOptions = {
        networkId,
    };

    const notes = await Note.query(networkOptions).where('blockNumber').above(lastSynced).toArray();

    const assetsKeys = notes.map(({asset}) => asset);
    const noteAccessKeys = assetsKeys.map(assetKey => `${assetKey}_${account}`);

    // Since v3.0.0-alpha.8
    // const assets = await Asset.bulkGet(networkOptions, assetsKeys);
    // const acesses = await NoteAccess.bulkGet(networkOptions, noteAccessKeys);

    const data = [];
    for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        const asset = await Asset.get(networkOptions, assetsKeys[i]);
        const acess = await NoteAccess.get(networkOptions, noteAccessKeys[i]);
        data.push(packNote(note, acess, asset));
    }

    const {
        noteLogs = [],
    } = data || {};

    return noteLogs.map(({
        noteAccess: {
            note,
            ...noteAccess
        },
        ...rest
    }) => ({
        ...noteAccess,
        ...note,
        ...rest,
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

//     const query = !noteId
//         ? `
//             query($first: Int!, $where: NoteLog_filter, $orderBy: NoteLog_orderBy) {
//                 noteLogs(first: $first, where: $where, orderBy: $orderBy) {
//                     logId: id
//                     account {
//                         address
//                     }
//                     noteAccess {
//                         viewingKey
//                         note {
//                             hash
//                             asset {
//                                 address
//                                 linkedTokenAddress
//                                 scalingFactor
//                                 canAdjustSupply
//                                 canConvert
//                             }
//                             owner {
//                                 address
//                             }
//                         }
//                     }
//                     status
//                 }
//             }
//         `
//         : `
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
//     };
//     if (noteId) {
//         where.note = noteId;
//     }
//     if (blockNumber) {
//         where.timestamp_gte = blockNumber;
//     }
//     const variables = {
//         first: numberOfNotes,
//         where,
//         orderBy: noteId ? 'timestamp' : 'id',
//     };

//     const data = await GraphNodeService.query({
//         query,
//         variables,
//         onError,
//     });

//     const {
//         noteLogs = [],
//         noteAccesses = [],
//     } = data || {};

//     if (noteId) {
//         return noteAccesses.map(({
//             note,
//             ...rest
//         }) => ({
//             ...rest,
//             ...note,
//         }));
//     }

//     return noteLogs.map(({
//         noteAccess: {
//             note,
//             ...noteAccess
//         },
//         ...rest
//     }) => ({
//         ...noteAccess,
//         ...note,
//         ...rest,
//     }));
// }
