import storage from '../helpers/storage.js';
import utils from '../helpers/utils.js';

const resolvers = {
    Query: {
        getNoteById: async (root, args) => {
            const {
                [args.id]: note,
            } = await storage.get(args.id);

            return note;
        },
        getNotesByValue: async (root, args) => {

            const groupId = utils.getNoteGroupId(args.value);
            const assetValueId = utils.assetValuePrefix(args.assetId, groupId);
            const {
                [assetValueId]: noteIds,
            } = await storage.get(assetValueId);

            const noteHashes = await storage.get(noteIds.map((noteId) => utils.notePrefix(noteId)));
            const notesByHash = await storage.get(Object.values(noteHashes));
            return noteHashes.map((hash) => notesByHash[hash]);

        },
    },
};

export default resolvers;
