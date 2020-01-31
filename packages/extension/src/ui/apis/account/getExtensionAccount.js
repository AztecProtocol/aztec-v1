import apollo from '~/ui/apis/helpers/apollo';

export default async function getExtensionAccount(address) {
    const {
        account: accountResponse,
    } = await apollo.query(`
        account(address: "${address}") {
            account {
                address
                linkedPublicKey
                spendingPublicKey
            }
        }
    `) || {};

    const { account } = accountResponse || {};
    if (!account) {
        return {
            address,
            linkedPublicKey: '',
            spendingPublicKey: '',
        };
    }

    return account;
}
