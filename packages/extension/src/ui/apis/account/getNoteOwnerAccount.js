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
        return null;
    }

    return user;
}
