import metadata from '~utils/metadata';

const notesOnly = notes => ({
    hasAccess: address => notes.filter(hasAccess(address)),
});

const hasAccess = address => ({ owner, metadata: metadataStr }) => owner === address || !!metadata(metadataStr).getAccess(address);


export default function associatedNotesWithOwner({
    createNotes,
    updateNotes,
    destroyNotes,
},
address) {
    return {
        createNotes: notesOnly(createNotes).hasAccess(address),
        updateNotes: notesOnly(updateNotes).hasAccess(address),
        destroyNotes: notesOnly(destroyNotes).hasAccess(address),
    };
}
