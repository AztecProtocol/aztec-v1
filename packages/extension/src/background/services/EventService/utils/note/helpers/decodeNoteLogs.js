import abi from 'web3-eth-abi';
import {
    ZkAsset,
} from '~/config/contracts';
import groupBy from '~/utils/groupBy';
import { NOTE_STATUS } from '~/config/constants';

const decode = (inputs, rawLog) => {
    const [,
        firstInput,
        secondInput,
    ] = rawLog.topics;

    const decoded = {
        ...abi.decodeLog(inputs, rawLog.data, [
            firstInput,
            secondInput,
        ]),
        blockNumber: rawLog.blockNumber,
    };
    return decoded;
};

const findInputsFromAbi = eventName => ZkAsset.config.abi.find(({ name, type }) => name === eventName && type === 'event').inputs;

const decodeLog = rawLog => ({
    createNote: () => {
        const inputs = findInputsFromAbi(ZkAsset.events.createNote);
        return {
            ...decode(inputs, rawLog),
            asset: rawLog.address,
            status: NOTE_STATUS.CREATED,
        };
    },
    updateNoteMetaData: () => {
        const inputs = findInputsFromAbi(ZkAsset.events.updateNoteMetaData);
        return {
            ...decode(inputs, rawLog),
            asset: rawLog.address,
            status: NOTE_STATUS.CREATED,
        };
    },
    destroyNote: () => {
        const inputs = findInputsFromAbi(ZkAsset.events.destroyNote);
        return {
            ...decode(inputs, rawLog),
            asset: rawLog.address,
            status: NOTE_STATUS.DESTROYED,
        };
    },
});

const noteLog = decodedLog => ({
    owner: decodedLog.owner,
    noteHash: decodedLog.noteHash,
    blockNumber: decodedLog.blockNumber,
    asset: decodedLog.asset,
    status: decodedLog.status,
    metadata: decodedLog.metadata,
});

export default function decodeNoteLogs(eventsTopics, rawLogs) {
    const [
        createNoteTopic,
        destroyNoteTopic,
        updateNoteMetaDataTopic,
    ] = eventsTopics;

    const onlyMinedLogs = rawLogs.filter(({ blockNumber, type }) => !!blockNumber || type === 'mined');
    const groupedRawLogs = groupBy(onlyMinedLogs, l => l.topics[0]);

    const createNotes = (groupedRawLogs[createNoteTopic] || [])
        .map(log => noteLog(decodeLog(log).createNote()));

    const updateNotes = (groupedRawLogs[updateNoteMetaDataTopic] || [])
        .map(log => noteLog(decodeLog(log).updateNoteMetaData()));

    const destroyNotes = (groupedRawLogs[destroyNoteTopic] || [])
        .map(log => noteLog(decodeLog(log).destroyNote()))
        .map(({
            metadata,
            ...note
        }) => note);

    const lastBlockNumber = () => [
        createNotes[createNotes.length - 1],
        updateNotes[updateNotes.length - 1],
        destroyNotes[destroyNotes.length - 1],
    ]
        .filter(event => !!event)
        .map(({ blockNumber }) => blockNumber)
        .reduce((acum, curr) => (acum > curr ? acum : curr), 0);

    return {
        createNotes,
        updateNotes,
        destroyNotes,
        isEmpty: () => !createNotes.length && !updateNotes.length && !destroyNotes.length,
        allNotes: () => [
            ...createNotes,
            ...updateNotes,
            ...destroyNotes,
        ],
        lastBlockNumber,
    };
}
