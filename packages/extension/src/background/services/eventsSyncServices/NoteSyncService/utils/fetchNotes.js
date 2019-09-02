import Web3Service from '~background/services/Web3Service';
import {
    IZkAssetConfig,
} from '~background/config/contracts';
import decodeNoteLogs from './decodeNoteLogs'
 
export default async function fetchNotes({
    fromBlock,
    toBlock = 'latest',
    onError,
} = {}) {
    const { abi, getPastLogs } = Web3Service.eth;

    const eventsTopics = [
        IZkAssetConfig.events.createNote,
        IZkAssetConfig.events.destroyNote,
        IZkAssetConfig.events.updateNoteMetaData,
    ]
        .map(e => IZkAssetConfig.config.abi.find(({name, type})=> name === e && type === 'event'))
        .map(abi.encodeEventSignature);

    const options = {
        fromBlock, 
        toBlock,
        topics: [
            eventsTopics,
        ],
    };

    try {
        const rawLogs = await getPastLogs(options);
        return decodeNoteLogs(eventsTopics, rawLogs);
        
    } catch (error) {
        onError(error);
        return [];
    };
}
