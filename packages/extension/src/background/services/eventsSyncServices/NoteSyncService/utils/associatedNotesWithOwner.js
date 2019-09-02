import parseAddressesFromMetadata from './addNote/utils/parseAddressesFromMetadata';

const filter = (ownerAddress) => {
    let addresses;
    return ({owner, metadata}) => {
        if (owner === ownerAddress) return true;
        addresses = parseAddressesFromMetadata(metadata);
        return addresses.includes(ownerAddress);
    } 
}  

export default function associatedNotesWithOwner({
        createNotes,
        updateNotes,
        destroyNotes,
    }, 
    ownerAddress) {
    
    return {
        createNotes: createNotes.filter(filter(ownerAddress)), 
        updateNotes: updateNotes.filter(filter(ownerAddress)),
        destroyNotes: destroyNotes.filter(filter(ownerAddress)), 
    }
}