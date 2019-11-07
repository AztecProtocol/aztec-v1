module.exports = (contract, networkId) => {
    return contract.networks[networkId].address;
};
