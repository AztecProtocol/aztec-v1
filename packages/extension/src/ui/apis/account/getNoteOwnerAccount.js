import ApiError from '~/helpers/ApiError';
import apollo from '~ui/apis/helpers/apollo';

export default async function getNoteOwnerAccount(address) {
    const {
        user,
    } = await apollo.query(`
        user(id: "${address}") {
            address
            linkedPublicKey
            spendingPublicKey
        }
    `);

    if (!user || !user.spendingPublicKey) {
        throw new ApiError('account.not.linked', {
            address,
        });
    }

    return user;
}
