import storage from '../helpers/storage.js';
import utils from '../helpers/utils.js';

// TODO we need to have a queue style service to stop multiple assets from being overidden. If either createNote or
// destroyNote are being called by the extension this should block.


const SyncService = {
    TX_LOCK : false,
    createNote: async (data) => {

        let {
            [data.asset]:assetId,
        } = await storage.get([data.asset]);
        const setObj = {};

        // create the asset id if it doesn't exist

        if(!assetId) {
            const { assetCount = 0 } = await storage.get(['assetCount']);
            assetId = utils.assetPrefix(assetCount + 1);
            setObj.assetCount = assetCount + 1;
            setObj[data.asset] = assetId;
            // TODO store asset data here e.g name / image etc..
        }
        const rawAssetId = parseInt(assetId.split(':')[1]);
        const noteGrouping = utils.getNoteGroupId(data.value);
        const assetValueId = utils.assetValuePrefix(rawAssetId, noteGrouping);

        const {
            noteCount = 0,
            [assetValueId]: valueIndex = [],
        } = await storage.get(['noteCount', assetValueId]);

        const noteId = utils.notePrefix(noteCount + 1);
        valueIndex.push(noteCount + 1);

        setObj[data.noteHash] = {
            ...data,
            asset: rawAssetId,
            id: noteCount + 1,
        };
        delete setObj[data.noteHash].noteHash;
        setObj.noteCount = noteCount + 1;
        setObj[assetValueId] = valueIndex;
        setObj[noteId] = data.noteHash;
        await storage.set(setObj);
    },
    destroyNote: async(noteHash) => {
        // we need to set the note status
        // we need to remove the note from the values index
        const {
            [noteHash]: {
                value,
                id,
                asset,
            },
        } = await storage.get(noteHash);

        const groupId= utils.getNoteGroupId(value);
        const assetValueId = utils.assetValuePrefix(asset, groupId);
        const {
            [assetValueId] : valueIndex,
        } = await storage.get(assetValueId);

        const index = valueIndex.indexOf(id);

        if (index > -1) {
            valueIndex.splice(index, 1);
        }

        await storage.set({
            [assetValueId]:  valueIndex,
        });

    },
    //  simple write lock to prevent race conditions in the DB 
    atomicTransaction: (method, data) => {
        const tick = async (resolve, reject) => {
            if (!SyncService.TX_LOCK) {
                SyncService.TX_LOCK = true;
                const result = await SyncService[method](data);
                SyncService.TX_LOCK = false;
                resolve(result);
            }
            else {
                setTimeout(()=> {
                    tick(resolve, reject);
                }, 10);
            }
        }
        return new Promise(tick);
    },
};

export default SyncService;

