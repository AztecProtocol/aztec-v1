import Web3Service from '~background/services/Web3Service';
import {
    IZkAssetConfig,
} from '~background/config/contracts';
import groupBy from '~utils/groupBy';


const decodeCreateNote = (rawLog) => {
    const inputs = findInputsFromAbi(IZkAssetConfig.events.createNote);
    return decodeLog(inputs, rawLog);
}

const decodeDestroyNote = (rawLog) => {
    const inputs = findInputsFromAbi(IZkAssetConfig.events.createNote);
    return decodeLog(inputs, rawLog);
}

const decodeUpdateNoteMetaData = (rawLog) => {
    const inputs = findInputsFromAbi(IZkAssetConfig.events.createNote);
    return decodeLog(inputs, rawLog);
}

const findInputsFromAbi = (eventName) => {
    return IZkAssetConfig.config.abi.find(({name, type})=> name === eventName && type === 'event').inputs;
}

const decodeLog = (inputs, rawLog) => {
    const { abi } = Web3Service.eth;
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
    }
}


export default function decodeNoteLogs(eventsTopics, rawLogs) {
    const [ createNoteTopic, destroyNoteTopic, updateNoteMetaDataTopic ] = eventsTopics;

    const onlyMinedLogs = rawLogs.filter(({ blockNumber }) => !!blockNumber);
    const groupedRawLogs = groupBy(onlyMinedLogs, l => l.topics[0]);
    
    const createNotes = (groupedRawLogs[createNoteTopic] || [])
        .map(decodeCreateNote)
        .map(noteLog);

    const destroyNotes = (groupedRawLogs[destroyNoteTopic] || [])
        .map(decodeDestroyNote)
        .map(noteLog);

    const updateNotes = (groupedRawLogs[updateNoteMetaDataTopic] || [])
        .map(decodeUpdateNoteMetaData)
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