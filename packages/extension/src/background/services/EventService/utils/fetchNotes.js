import Web3Service from '~background/services/Web3Service';
import {
    IZkAssetConfig,
} from '~background/config/contracts';
import decodeNoteLogs from './helpers/decodeNoteLogs';


export default async function fetchNotes({
    owner,
    noteHash,
    fromBlock,
    fromAssets = [],
    toBlock = 'latest',
    networkId,
} = {}) {
    const { abi, getPastLogs } = Web3Service(networkId).eth;

    const eventsTopics = [
        IZkAssetConfig.events.createNote,
        IZkAssetConfig.events.destroyNote,
        IZkAssetConfig.events.updateNoteMetaData,
    ]
        .map(e => IZkAssetConfig.config.abi.find(({ name, type }) => name === e && type === 'event'))
        .map(abi.encodeEventSignature);

    const ownerTopics = owner ? abi.encodeParameter('address', owner) : [];
    const noteTopics = noteHash ? abi.encodeParameter('bytes32', noteHash) : [];

    const options = {
        fromBlock,
        toBlock,
        address: fromAssets,
        topics: [
            eventsTopics,
            ownerTopics,
            noteTopics,
        ],
    };

    try {
        const rawLogs = await getPastLogs(options);
        console.log(`rawLogs: ${JSON.stringify(rawLogs)}`);
        const groupedNotes = decodeNoteLogs(eventsTopics, rawLogs);

        return {
            error: null,
            groupedNotes,
        };
    } catch (error) {
        return {
            error,
            groupedNotes: null,
        };
    }
}
