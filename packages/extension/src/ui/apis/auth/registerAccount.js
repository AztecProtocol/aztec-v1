import RegisterAccount from '~ui/mutations/RegisterAccount';
import apollo from '~ui/apis/helpers/apollo';

export default async function registerAccount({
    address,
    linkedPublicKey,
    spendingPublicKey,
    signature,
    blockNumber,
}) {
    const {
        registerAddress: {
            account,
        } = {},
    } = await apollo.mutate({
        mutation: RegisterAccount,
        variables: {
            address,
            signature,
            linkedPublicKey,
            spendingPublicKey,
            blockNumber,
            domain: window.location.origin,
        },
    });

    return {
        success: !!account,
    };
}
