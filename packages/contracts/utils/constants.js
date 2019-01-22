const BN = require('bn.js');

module.exports = {
    DAI_ADDRESS: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359', // address of the mainNet DAI smart contract
    // generic scaling factor that maps between AZTEC note values and ERC20 token balances.
    // when used for DAI token, 1 AZTEC note value = 0.1 DAI
    ERC20_SCALING_FACTOR: new BN('100000000000000000', 10),
    ZERO_ADDRESS: '0x0000000000000000000000000000000000000000',
};
