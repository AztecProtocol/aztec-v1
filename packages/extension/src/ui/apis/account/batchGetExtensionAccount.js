import getExtensionAccount from './getExtensionAccount';

export default async function batchGetExtensionAccount(addresses) {
    const uniqueAddresses = addresses
        .filter((addr, idx, arr) => arr.indexOf(addr) === idx);
    const accountMapping = {};
    await Promise.all(uniqueAddresses.map(async (addr) => {
        accountMapping[addr] = await getExtensionAccount(addr);
    }));

    return addresses.map(addr => accountMapping[addr]);
}
