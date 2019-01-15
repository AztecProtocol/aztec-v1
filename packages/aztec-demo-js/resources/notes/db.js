const { database } = require('../../db');
const { NOTE_STATUS } = require('../../config');

const notes = {};

notes.getInitialState = () => ({
    publicKey: '',
    viewingKey: '',
    k: '',
    a: '',
    owner: '',
    noteHash: '',
    parentToken: '',
    status: NOTE_STATUS.OFF_CHAIN,
});

notes.create = (data) => {
    const note = database().get('notes').find({ noteHash: data.noteHash }).value();
    if (note) { throw new Error(`note ${data.noteHash} already exists`); }
    database().get('notes')
        .push({ ...notes.getInitialState(), ...data })
        .write();
    const result = database().get('notes').find({ noteHash: data.noteHash }).value();
    return result;
};

notes.update = (noteHash, data) => {
    const note = database()
        .get('notes')
        .find({ noteHash })
        .assign(data)
        .write();
    return note;
};

notes.get = (noteHash) => {
    const note = database().get('notes').find({ noteHash }).value();
    return note;
};

module.exports = notes;
