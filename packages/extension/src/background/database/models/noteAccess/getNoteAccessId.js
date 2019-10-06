
export default function getNoteAccessId(account, noteHash) {
    return `${account}_${noteHash}`;
}
