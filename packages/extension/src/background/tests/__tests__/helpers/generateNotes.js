import {
    createNotes,
} from '~utils/note';


export default async function generateNotes(values, sender) {
    // throw an error from web3-providers
    // "Connection refused or URL couldn't be resolved: http://localhost:8545"
    // if create notes ascyncronously and then call .send or .call on contracts
    const {
        publicKey,
        address,
        linkedPublicKey,
    } = sender;
    return createNotes(values, publicKey, address, linkedPublicKey);
}
