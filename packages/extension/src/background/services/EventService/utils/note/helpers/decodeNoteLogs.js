import Web3Service from '~helpers/NetworkService';
import {
    IZkAssetConfig,
} from '~config/contracts';
import groupBy from '~utils/groupBy';
import { NOTE_STATUS } from '~background/config/constants';


const decode = (inputs, rawLog) => {
    const [,
        firstInput,
        secondInput,
    ] = rawLog.topics;

    const { abi } = Web3Service().eth;
    const decoded = {
        ...abi.decodeLog(inputs, rawLog.data, [
            firstInput,
            secondInput,
        ]),
        blockNumber: rawLog.blockNumber,
    };
    return decoded;
};

const findInputsFromAbi = eventName => IZkAssetConfig.config.abi.find(({ name, type }) => name === eventName && type === 'event').inputs;

const decodeLog = (rawLog, networkId) => ({
    createNote: () => {
        const inputs = findInputsFromAbi(IZkAssetConfig.events.createNote);
        return {
            ...decode(inputs, rawLog, networkId),
            asset: rawLog.address,
            status: NOTE_STATUS.CREATED,
        };
    },
    updateNoteMetaData: () => {
        const inputs = findInputsFromAbi(IZkAssetConfig.events.updateNoteMetaData);
        return {
            ...decode(inputs, rawLog, networkId),
            asset: rawLog.address,
            status: NOTE_STATUS.CREATED,
        };
    },
    destroyNote: () => {
        const inputs = findInputsFromAbi(IZkAssetConfig.events.destroyNote);
        return {
            ...decode(inputs, rawLog, networkId),
            asset: rawLog.address,
            status: NOTE_STATUS.DESTROYED,
        };
    },
});

const noteLog = decodedLog => ({
    owner: decodedLog.owner,
    noteHash: decodedLog.noteHash,
    metadata: decodedLog.metadata,
    blockNumber: decodedLog.blockNumber,
    asset: decodedLog.asset,
    status: decodedLog.status,
});


export default function decodeNoteLogs(eventsTopics, rawLogs, networkId) {
    const [
        createNoteTopic,
        destroyNoteTopic,
        updateNoteMetaDataTopic,
    ] = eventsTopics;

    const onlyMinedLogs = rawLogs.filter(({ blockNumber, type }) => !!blockNumber || type === 'mined');
    const groupedRawLogs = groupBy(onlyMinedLogs, l => l.topics[0]);

    const createNotes = (groupedRawLogs[createNoteTopic] || [])
        .map(log => decodeLog(log, networkId).createNote())
        .map(noteLog);

    const updateNotes = (groupedRawLogs[updateNoteMetaDataTopic] || [])
        .map(log => decodeLog(log, networkId).updateNoteMetaData())
        .map(noteLog);

    const destroyNotes = (groupedRawLogs[destroyNoteTopic] || [])
        .map(log => decodeLog(log, networkId).destroyNote())
        .map(noteLog);

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
