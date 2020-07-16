import Web3 from 'web3';
import Web3Service from '~/helpers/Web3Service';
import {
    ZkAsset,
} from '~/config/contracts';
import decodeNoteLogs from './helpers/decodeNoteLogs';
import { getProviderUrl } from '~/utils/network';

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
} = {}) {
    // TODO require network selection
    const provider = new Web3.providers.HttpProvider(getProviderUrl(Web3Service.networkId));
    const { abi, getPastLogs } = new Web3(provider).eth;

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
