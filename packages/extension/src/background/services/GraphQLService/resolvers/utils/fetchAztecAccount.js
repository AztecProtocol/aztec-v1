import Account from '~/background/database/models/account';
import fetchAztecAccountOnChain from './fetchAztecAccountOnChain';

export default async function fetchAztecAccount({
    address,
    networkId,
}) {
    let account = await Account.get(
        {
            networkId,
        },
        address,
    );
    let error;

    if (!account) {
        ({
            error,
            account,
        } = await fetchAztecAccountOnChain({
            address,
        }) || {});
    }

    return {
        error,
        account,
    };
}
