import NetworkService from '~helpers/NetworkService';
import {
    IZkAssetConfig,
} from '~config/contracts';
import decodeNoteLogs from './helpers/decodeNoteLogs';


export default async function fetchNotes({
    owner,
    noteHash,
    fromBlock,
    fromAssets = null,
    toBlock = 'latest',
} = {}) {
    const web3Service = await NetworkService();
    const { abi, getPastLogs } = (await NetworkService()).eth;

    const eventsTopics = [
        IZkAssetConfig.events.createNote,
        IZkAssetConfig.events.destroyNote,
        IZkAssetConfig.events.updateNoteMetaData,
    ]
        .map(e => IZkAssetConfig.config.abi.find(({ name, type }) => name === e && type === 'event'))
        .map(abi.encodeEventSignature);

    const ownerTopics = owner ? abi.encodeParameter('address', owner) : null;
    const noteTopics = noteHash ? abi.encodeParameter('bytes32', noteHash) : null;

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
