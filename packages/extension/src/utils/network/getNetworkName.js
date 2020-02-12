import networks from '~/config/networks';

export default function getNetworkName(networkId) {
    let networkKey = Object.keys(networks)
        .find(name => `${networks[name].id}` === `${networkId}`);
    if (!networkKey) {
        networkKey = 'GANACHE';
    }

    const {
        networkName,
    } = networks[networkKey];

    return networkName;
}
