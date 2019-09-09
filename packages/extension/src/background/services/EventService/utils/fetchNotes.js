import Web3Service from '~background/services/Web3Service';
import {
    IZkAssetConfig,
} from '~background/config/contracts';
import decodeNoteLogs from './helpers/decodeNoteLogs'
 
export default async function fetchNotes({
    owner,
    fromBlock,
    toBlock = 'latest',
} = {}) {
    const { abi, getPastLogs } = Web3Service.eth;

    const eventsTopics = [
        IZkAssetConfig.events.createNote,
        IZkAssetConfig.events.destroyNote,
        IZkAssetConfig.events.updateNoteMetaData,
    ]
        .map(e => IZkAssetConfig.config.abi.find(({name, type})=> name === e && type === 'event'))
        .map(abi.encodeEventSignature);

    const ownerTopic = abi.encodeParameter('address', owner);

    const options = {
        fromBlock, 
        toBlock,
        topics: [
            eventsTopics,
            ownerTopic,
        ],
    };

    try {
        const rawLogs = await getPastLogs(options);
        const groupedNotes = decodeNoteLogs(eventsTopics, rawLogs);
        return { error: null, groupedNotes };
        
    } catch (error) {
        return { error, groupedNotes: null };
    };
}
