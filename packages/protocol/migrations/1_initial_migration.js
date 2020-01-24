/* global artifacts */
const Migrations = artifacts.require('./Migrations.sol');

module.exports = (deployer) => {
    deployer.deploy(Migrations).then(
        (contract) =>
            new Promise((resolve) =>
                setTimeout(() => {
                    resolve(contract);
                }, 2000),
            ),
    );
};
