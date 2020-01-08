/* eslint-disable prefer-destructuring */
/* global artifacts, expect, contract, beforeEach, it, web3:true */
// ### External Dependencies

// ### Internal Dependencies
/* eslint-disable-next-line object-curly-newline */
const truffleAssert = require('truffle-assertions');
const {
    constants: { addresses },
} = require('@aztec/dev-utils');

// ### Artifacts
const AdminUpgradeabilityProxy = artifacts.require('./Proxies/AdminUpgradeabilityProxy.sol');
const Behaviour = artifacts.require('./noteRegistry/epochs/201907/Behaviour201907.sol');
const BehaviourWithConflictTest = artifacts.require('./test/BehaviourWithConflictTest.sol');

contract('Proxy', (accounts) => {
    const [owner, secondOwner, nonOwner] = accounts;

    let proxyContract;
    let behaviourContract;

    beforeEach(async () => {
        behaviourContract = await Behaviour.new();
        proxyContract = await AdminUpgradeabilityProxy.new(behaviourContract.address, owner, []);
    });

    describe('Success States', async () => {
        it('should successfully deploy a proxy contract', async () => {
            const implementation = await proxyContract.implementation.call();

            expect(implementation).to.equal(behaviourContract.address);
        });

        it('should change admin if called by admin', async () => {
            const receipt = await proxyContract.changeAdmin(secondOwner, {
                from: owner,
            });

            const event = receipt.logs.find((l) => l.event === 'AdminChanged');
            expect(event.args.newAdmin).to.equal(secondOwner);
        });

        it('should delegate non-admin call even if fn name exists in proxy', async () => {
            const behaviourWithConflict = await BehaviourWithConflictTest.new();
            await proxyContract.upgradeTo(behaviourWithConflict.address, {
                from: owner,
            });
            await proxyContract.admin({ from: nonOwner });
            const topic = web3.utils.keccak256('ReachedBehaviour()');
            const logs = await new Promise((resolve) => {
                web3.eth
                    .getPastLogs({
                        address: proxyContract.address,
                        topics: [topic],
                    })
                    .then(resolve);
            });
            expect(logs.length).to.not.equal(0);
        });
    });

    describe('Failure States', async () => {
        it('should fail to change admin if called by non-admin', async () => {
            await truffleAssert.reverts(
                proxyContract.changeAdmin(secondOwner, {
                    from: nonOwner,
                }),
            );
        });

        it('should fail to upgrade if not admin', async () => {
            const newBehaviour = await Behaviour.new();
            await truffleAssert.reverts(
                proxyContract.upgradeTo(newBehaviour.address, {
                    from: nonOwner,
                }),
            );
        });

        it('should fail to set implementation to 0x0', async () => {
            await truffleAssert.reverts(
                proxyContract.upgradeTo(addresses.ZERO_ADDRESS, {
                    from: owner,
                }),
            );
        });
    });
});
