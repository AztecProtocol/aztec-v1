module.exports = (networkId) => {
    // ganache has timestamp networkId
    return Number.isInteger(networkId) && networkId >= 1574691972646;
};
