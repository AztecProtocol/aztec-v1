// import storage from '../helpers/storage.js';
// import utils from '../helpers/utils.js';
const ID = () => {
    const array = new Uint32Array(8)
    window.crypto.getRandomValues(array)
    let str = ''
    for (let i = 0; i < array.length; i++) {
        str += (i < 2 || i > 5 ? '' : '-') + array[i].toString(16).slice(-4)
    }
    return str
}
const resolvers = {
    Query: {
        notes: async (root, args) => {
            const result = new Promise((resolve)=> {
                const requestId = ID();

                window.postMessage({
                    type: 'graphql-query',
                    :
                    requestId,
                    ...args,
                }, '*');

                window.addEventListener("message", (event)=> {
                    if(event.data.type === 'graphql-response' && event.data.responseId === requestId) {
                        resolve(event.data.response);
                    }
                }, false);

            });
            const note = await result;
            return note;
        },
        
        getOwner: () => {

        }
        // Mutation: {
        //     note: async (parent, args) => {
        //         const note = await SyncService.createNote
        //         return note;
        //     }
        // },
        // getNotesByValue: async (root, args) => {

        //     const groupId = utils.getNoteGroupId(args.value);
        //     const assetValueId = utils.assetValuePrefix(args.assetId, groupId);
        //     const {
        //         [assetValueId]: noteIds,
        //     } = await storage.get(assetValueId);

        //     const noteHashes = await storage.get(noteIds.map((noteId) => utils.notePrefix(noteId)));
        //     const notesByHash = await storage.get(Object.values(noteHashes));
        //     return noteHashes.map((hash) => notesByHash[hash]);

        // },
    },
};

export default resolvers;
