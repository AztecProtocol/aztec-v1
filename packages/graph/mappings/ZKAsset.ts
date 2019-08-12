import { BigInt, Bytes, Address } from '@graphprotocol/graph-ts';
import { CreateNote, DestroyNote, UpdateNoteMetaData } from '../types/ACE/templates/ZkAsset/ZkAsset';
import { Account, Note, NoteAccess, NoteLog } from '../types/schema';
import { stripLeadingZeros } from './utils';

// including 0x
var ID_SUFFIX_LEN = 4;
var METADATA_PREFIX_LEN = 194;
var METADATA_VAR_LEN = 32;
var METADATA_ADDRESS_LEN = 40;
var METADATA_VIEWING_KEY_LEN = 420;

function ensureAccount(address: Address): void {
    let id = address.toHexString();
    let account = Account.load(id);
    if (account == null) {
        account = new Account(id);
        account.address = address;
        account.save();
    }
}

function createNoteLog(timestamp: BigInt, accessId: String, account: Address, status: String): void {
    let logId = '';
    let logIndex = -1;
    let log = NoteLog.load(logId);
    let maxIdOffset = Math.pow(10, ID_SUFFIX_LEN);
    let timePrefix = timestamp;
    do {
        logIndex += 1;
        if (logIndex === maxIdOffset) {
            logIndex = 0;
            timePrefix += BigInt.fromI32(1);
        }
        let indexStr = logIndex.toString().padStart(ID_SUFFIX_LEN, '0');
        logId = timePrefix.toString().concat(indexStr);
        log = NoteLog.load(logId);
    } while (log != null);

    let newLog = new NoteLog(logId);
    newLog.noteAccess = accessId;
    newLog.account = account.toHexString();
    newLog.status = status;
    newLog.timestamp = timestamp;
    newLog.save();
}

function createNoteAccess(timestamp: BigInt, noteHash: Bytes, account: Address, viewingKey: Bytes): string {
    ensureAccount(account);

    let accessId = viewingKey.toHexString();
    let newAccess = new NoteAccess(accessId);
    newAccess.note = noteHash.toHexString();
    newAccess.account = account.toHexString();
    newAccess.viewingKey = viewingKey;
    newAccess.timestamp = timestamp;
    newAccess.save();

    return accessId;
}

function parseNoteAccessFromMetadata(metadata: Bytes): Map<string, Bytes> {
    // use string as key
    // since accessMap.get(<Bytes>) will break as of @graphprotocol/graph-ts@0.12.0
    let accessMap = new Map<string, Bytes>();
    let metadataStr = metadata.toHexString();
    if (metadataStr.length > METADATA_PREFIX_LEN) {
        let addressLenStr = stripLeadingZeros(metadataStr.slice(METADATA_PREFIX_LEN, METADATA_PREFIX_LEN + METADATA_VAR_LEN));
        let addressesLen = Bytes.fromHexString(addressLenStr).toI32();
        let addressCount = addressesLen / METADATA_ADDRESS_LEN;
        let addressStart = METADATA_PREFIX_LEN + METADATA_VAR_LEN * 3;
        let addressEnd = addressStart + addressesLen;

        for (let i = 0; i < addressCount; i += 1) {
            let addressOffset = addressStart + i * METADATA_ADDRESS_LEN;
            let address = metadataStr.slice(addressOffset, addressOffset + METADATA_ADDRESS_LEN);
            let viewingKeyOffset = addressEnd + i * METADATA_VIEWING_KEY_LEN;
            let viewingKey = metadataStr.slice(viewingKeyOffset, viewingKeyOffset + METADATA_VIEWING_KEY_LEN);
            accessMap.set('0x'.concat(address), <Bytes>Bytes.fromHexString(viewingKey));
        }
    }
    return accessMap;
}

// Use this to get an array of addresses
// since Map.keys doesn't work as of @graphprotocol/graph-ts@0.12.0
function getAddressesInMetadata(metadata: Bytes): Array<Bytes> {
    let addresses = new Array<Bytes>();
    let metadataStr = metadata.toHexString();
    if (metadataStr.length > METADATA_PREFIX_LEN) {
        let addressLenStr = stripLeadingZeros(metadataStr.slice(METADATA_PREFIX_LEN, METADATA_PREFIX_LEN + METADATA_VAR_LEN));
        let addressesLen = Bytes.fromHexString(addressLenStr).toU32();
        let addressCount = addressesLen / METADATA_ADDRESS_LEN;
        let addressStart = METADATA_PREFIX_LEN + METADATA_VAR_LEN * 3;
        let addressEnd = addressStart + addressesLen;

        for (let i = addressStart; i < addressEnd; i += METADATA_ADDRESS_LEN) {
            let address = metadataStr.slice(i, i + METADATA_ADDRESS_LEN);
            addresses.push(<Bytes>Bytes.fromHexString(address));
        }
    }
    return addresses;
}

function createNoteLogForAllAccess(timestamp: BigInt, metadata: Bytes, status: String): void {
    let addresses = getAddressesInMetadata(metadata);
    let accessMap = parseNoteAccessFromMetadata(metadata);
    for (let i = 0; i < addresses.length; i += 1) {
        let address = addresses[i];
        let addressKey = address.toHexString();
        let viewingKey = accessMap.get(addressKey);
        let accessId = viewingKey.toHexString();

        createNoteLog(timestamp, accessId, <Address>address, status);
    }
}

function createAccessFromMetadata(timestamp: BigInt, note: Note | null, metadata: Bytes, prevMetadata: Bytes): void {
    let addresses = getAddressesInMetadata(metadata);
    let accessMap = parseNoteAccessFromMetadata(metadata);
    let prevAccessMap = parseNoteAccessFromMetadata(prevMetadata);
    for (let i = 0; i < addresses.length; i += 1) {
        let address = addresses[i];
        let addressKey = address.toHexString();
        let viewingKey = accessMap.get(addressKey);
        let prevViewingKey: Bytes | null = prevAccessMap.has(addressKey) ? prevAccessMap.get(addressKey) : null;
        if (viewingKey !== prevViewingKey) {
            let accessId = createNoteAccess(timestamp, note.hash, <Address>address, viewingKey);

            createNoteLog(timestamp, accessId, <Address>address, note.status);
        }
    }
}

export function createNote(event: CreateNote): void {
    var ownerAddress = event.params.owner;
    ensureAccount(ownerAddress);

    let ownerId = ownerAddress.toHexString();
    let noteHash = event.params.noteHash;
    let metadata = event.params.metadata;
    let noteId = noteHash.toHexString();
    let note = new Note(noteId);
    note.hash = noteHash;
    note.asset = event.address.toHexString();
    note.owner = ownerId;
    note.metadata = metadata;
    note.status = 'CREATED';
    note.save();

    let timestamp = event.block.timestamp;
    createAccessFromMetadata(timestamp, note, metadata, <Bytes>Bytes.fromHexString(''));
}

export function destroyNote(event: DestroyNote): void {
    let noteId = event.params.noteHash.toHexString();
    let note = Note.load(noteId);
    note.status = 'DESTROYED';
    note.save();

    let timestamp = event.block.timestamp;
    createNoteLogForAllAccess(timestamp, note.metadata, 'DESTROYED');
}

export function updateNoteMetaData(event: UpdateNoteMetaData): void {
    let timestamp = event.block.timestamp;
    let metadata = event.params.metadata;

    let noteHash = event.params.noteHash;
    let noteId = noteHash.toHexString();
    let note = Note.load(noteId);
    let prevMetadata = note.metadata;
    note.metadata = metadata;
    note.save();

    createAccessFromMetadata(timestamp, note, metadata, prevMetadata);
}
