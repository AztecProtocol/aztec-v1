import apollo from '~ui/apis/helpers/apollo';

export default async function getExtensionAccount(address) {
    const {
        account,
        error,
    } = await apollo.query(`
        account(address: "${address}") {
            address
            linkedPublicKey
            spendingPublicKey
        }
    `);
    console.log(account);

    if (!account || !account.linkedPublicKey) {
        return {
            address,
            linkedPublicKey: '',
        };
    }

    return account;
}
