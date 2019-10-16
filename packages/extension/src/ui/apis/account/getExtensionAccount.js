import apollo from '~ui/apis/helpers/apollo';

export default async function getExtensionAccount(address) {
    const {
        account,
    } = await apollo.query(`
        account(address: "${address}") {
            address
            linkedPublicKey
        }
    `);

    if (!account || !account.linkedPublicKey) {
        return {
            address,
            linkedPublicKey: '',
        };
    }

    return account;
}
