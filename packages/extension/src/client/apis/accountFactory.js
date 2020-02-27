import ConnectionService from '~/client/services/ConnectionService';
import Account from './Account';

export default async function accountFactory(address) {
    const { account } = await ConnectionService.query(
        'user',
        { id: address },
    ) || {};

    return new Account({
        ...account,
        address,
        id: address,
    });
}
