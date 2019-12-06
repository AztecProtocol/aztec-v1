import apollo from '~ui/apis/helpers/apollo';

export default async function getExtensionAccount(address) {
    const { account: accountResponse } = await apollo.query(`
            account(address: "${address}") {
                    account {
                        address
                        linkedPublicKey
                        spendingPublicKey
                    }
            }
    `);
    const { account } = accountResponse;

    if (!account || !account.linkedPublicKey) {
        return {
            address,
            linkedPublicKey: '',
            spendingPublicKey: '',
        };
    }

    return account;
}
