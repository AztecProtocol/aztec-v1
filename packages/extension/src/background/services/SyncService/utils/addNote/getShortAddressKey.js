import addressModel from '~database/models/address';

export default async function getShortAddressKey(address) {
    const {
        key,
    } = await addressModel.set(
        {
            address,
        },
        {
            ignoreDuplicate: true,
        },
    );

    return key;
}
