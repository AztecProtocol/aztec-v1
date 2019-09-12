import Web3Service from '~background/services/Web3Service';
import {
    IZkAssetConfig,
} from '~background/config/contracts';
import groupBy from '~utils/groupBy';


const decodeLog = (rawLog, networkId) => ({
    createNote: () => {
        const inputs = findInputsFromAbi(IZkAssetConfig.events.createNote);
        return decode(inputs, rawLog, networkId);
    },
    updateNoteMetaData: () => {
        const inputs = findInputsFromAbi(IZkAssetConfig.events.updateNoteMetaData);
        return decode(inputs, rawLog, networkId);
    },
    destroyNote: () => {
        const inputs = findInputsFromAbi(IZkAssetConfig.events.destroyNote);
        return decode(inputs, rawLog, networkId);
    },
});

const findInputsFromAbi = (eventName) => {
    return IZkAssetConfig.config.abi.find(({name, type})=> name === eventName && type === 'event').inputs;
}

const decode = (inputs, rawLog, networkId) => {
    const { abi } = Web3Service(networkId).eth;
    const decoded = {
        ...abi.decodeLog(inputs, rawLog.data, rawLog.topics),
        blockNumber: rawLog.blockNumber,
    };
    return decoded;
}

const noteLog = (decodedLog) => {
    return {
        owner: decodedLog.owner,
        noteHash: decodedLog.noteHash,
        metadata: decodedLog.metadata,
        blockNumber: decodedLog.blockNumber,
    };
}


export default function decodeNoteLogs(eventsTopics, rawLogs, networkId) {
    const [ createNoteTopic, destroyNoteTopic, updateNoteMetaDataTopic ] = eventsTopics;

    const onlyMinedLogs = rawLogs.filter(({ blockNumber, type }) => !!blockNumber || type === 'mined' );
    const groupedRawLogs = groupBy(onlyMinedLogs, l => l.topics[0]);
    
    const createNotes = (groupedRawLogs[createNoteTopic] || [])
        .map(log => decodeLog(log, networkId).createNote())
        .map(noteLog);

    const destroyNotes = (groupedRawLogs[destroyNoteTopic] || [])
        .map(log => decodeLog(log, networkId).updateNoteMetaData())
        .map(noteLog);

    const updateNotes = (groupedRawLogs[updateNoteMetaDataTopic] || [])
        .map(log => decodeLog(log, networkId).destroyNote())
        .map(noteLog);
    
    return { 
        createNotes,
        updateNotes,
        destroyNotes,
        isEmpty: () => {
            return !createNotes.length && !updateNotes.length && !destroyNotes.length;
        }
    };
}