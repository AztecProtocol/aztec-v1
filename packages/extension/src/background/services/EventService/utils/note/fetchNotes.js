import NetworkService from '~helpers/NetworkService';
import {
    ZkAsset,
} from '~config/contracts';
import decodeNoteLogs from './helpers/decodeNoteLogs';

export default async function fetchNotes({
    owner,
    noteHash,
    fromBlock,
    fromAssets = null,
    toBlock = 'latest',
    events = [
        ZkAsset.events.createNote,
        ZkAsset.events.destroyNote,
        ZkAsset.events.updateNoteMetaData,
    ],
    networkId,
} = {}) {
    const web3Service = await NetworkService({ networkId });
    const { abi, getPastLogs } = web3Service.eth;

    const eventsTopics = events
        .map(e => ZkAsset.config.abi.find(({ name, type }) => name === e && type === 'event'))
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
