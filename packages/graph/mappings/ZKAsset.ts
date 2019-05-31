import {
  CreateNote,
  DestroyNote,
} from '../types/ACE/templates/ZkAsset/ZkAsset';
import {
  Note,
  Account,
} from '../types/schema';

export function createNote(event: CreateNote): void {
  let ownerAddress = event.params.owner;
  let ownerId = ownerAddress.toHex();
  let account = Account.load(ownerId);
  if (account == null) {
    account = new Account(ownerId);
    account.address = ownerAddress;
  }
  account.save();

  let noteId = event.params.noteHash.toHex();
  let note = new Note(noteId);
  note.zkAsset = event.address.toHex();
  note.owner = ownerId;
  note.metadata = event.params.metadata;
  note.status = 'CREATED';
  note.save();
}

export function destroyNote(event: DestroyNote): void {
  let noteId = event.params.noteHash.toHex();
  let note = Note.load(noteId);
  note.status = 'DESTROYED';
  note.save();
}
