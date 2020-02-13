import uniq from 'lodash/uniq';
import getExtensionAccount from './getExtensionAccount';

export default async function batchGetExtensionAccount(addresses) {
    const uniqueAddresses = uniq(addresses);
    const accountMapping = {};
    await Promise.all(uniqueAddresses.map(async (addr) => {
        accountMapping[addr] = await getExtensionAccount(addr);
    }));

    return uniqueAddresses.map(addr => accountMapping[addr]);
}
