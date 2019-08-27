import {
    errorLog,
} from '~utils/log';
import Web3Service from '~background/services/Web3Service';
import {
    IZkAssetConfig,
} from '~background/config/contracts';
import decodeNoteLogs from './decodeNoteLogs'
 
export default async function fetchNotes({
    address,
    fromBlock,
    toBlock = 'latest',
    onError,
} = {}) {
    if (!address) {
        errorLog("'address' cannot be empty");
        return null;
    }
    const { abi, getPastLogs } = Web3Service.eth;

    const eventsTopics = [
        IZkAssetConfig.events.createNote,
        IZkAssetConfig.events.destroyNote,
        IZkAssetConfig.events.updateNoteMetaData,
    ]
        .map(e => IZkAssetConfig.config.abi.find(({name, type})=> name === e && type === 'event'))
        .map(abi.encodeEventSignature)

    const ownerTopic = abi.encodeParameter('address', address);

    const options = {
        fromBlock, 
        toBlock,
        topics: [
            eventsTopics,
            ownerTopic,
        ],
    }

    // console.log("options: " + JSON.stringify(options))

    try {
        const rawLogs = await getPastLogs(options);
        return await decodeNoteLogs(eventsTopics, rawLogs);
        
    } catch (error) {
        //TODO: Check error handling
        throw error;
        onError(error);
    }
}
