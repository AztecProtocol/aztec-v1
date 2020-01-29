import Web3Service from '~/helpers/Web3Service';
import Account from '~/background/database/models/account';
import fetchAztecAccountOnChain from './fetchAztecAccountOnChain';

export default async function fetchAztecAccount({
    address,
}) {
    let account = await Account.get(
        {
            networkId: Web3Service.networkId,
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
