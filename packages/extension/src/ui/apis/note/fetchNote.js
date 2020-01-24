import apollo from '~/ui/apis/helpers/apollo';
import {
    getCurrentUser,
} from '~/ui/apis/auth';

export default async function fetchNote(noteHash) {
    const currentUser = await getCurrentUser();

    const { note } = await apollo.query(`
        note(id: "${noteHash}", currentAddress: "${currentUser.address}") {
            value
            status
            noteHash
            metadata
            asset {
                address
                scalingFactor
                linkedTokenAddress
            }
            owner {
                address
            }
            decryptedViewingKey
        }
    `) || {};

    return note;
}
