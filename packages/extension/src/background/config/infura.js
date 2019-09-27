
export const infuraProviderConfig = (networkName, projectId) => {
    let networkId;
    switch (networkName) {
        case 'mainnet':
            networkId = 1;
            break;
        case 'ropsten':
            networkId = 3;
            break;
        case 'rinkeby':
            networkId = 4;
            break;
        case 'goerli':
            networkId = 5;
            break;
        case 'kovan':
            networkId = 42;
            break;

        default:
            return {};
    }

    return {
        title: networkName,
        networkId,
        providerUrl: `https://${networkName}.infura.io/v3/${projectId}`,
    };
};
