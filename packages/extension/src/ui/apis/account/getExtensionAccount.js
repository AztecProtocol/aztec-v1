import apollo from '~/ui/apis/helpers/apollo';

export default async function getExtensionAccount(address) {
    const {
        user,
    } = await apollo.query(`
        user(address: "${address}") {
            address
            linkedPublicKey
            spendingPublicKey
        }
    `) || {};

    if (!user) {
        return {
            address,
            linkedPublicKey: '',
            spendingPublicKey: '',
        };
    }

    return user;
}
