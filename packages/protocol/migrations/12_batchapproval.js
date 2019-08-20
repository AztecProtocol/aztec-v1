var BatchApproval = artifacts.require('./BatchApproval.sol');
const ACE = artifacts.require('./ACE.sol');


module.exports = async function(deployer) {
    let aceContract = await ACE.deployed();
    await deployer.deploy(BatchApproval, aceContract.address);
};
