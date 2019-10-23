import query from '../utils/query';

export default async function registerExtension() {
    const {
        currentProvider: {
            networkVersion: networkId,
        },
    } = window.web3;
    const data = await query({
        type: 'registerExtension',
        args: {
            networkId,
        },
    }) || {};


    return data;
}
