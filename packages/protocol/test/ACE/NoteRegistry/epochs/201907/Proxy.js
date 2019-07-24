/* eslint-disable prefer-destructuring */
/* global artifacts, expect, contract, beforeEach, it, web3:true */
// ### External Dependencies

// ### Internal Dependencies
/* eslint-disable-next-line object-curly-newline */
const { proofs } = require('@aztec/dev-utils');
const truffleAssert = require('truffle-assertions');

// ### Artifacts
const AdminUpgradeabilityProxy = artifacts.require('./noteRegistry/proxies/AdminUpgradeabilityProxy.sol');
const Behaviour = artifacts.require('./noteRegistry/epochs/201907/Behaviour201907.sol');


const { BOGUS_PROOF, JOIN_SPLIT_PROOF } = proofs;

contract('Proxy', (accounts) => {
    const [owner, secondOwner, nonOwner] = accounts;

    let proxyContract;
    let behaviourContract;

    beforeEach(async () => {
        behaviourContract = await Behaviour.new();
        proxyContract = await AdminUpgradeabilityProxy.new(
            behaviourContract.address,
            owner,
            []
        );
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

            const event = receipt.logs.find(l => l.event === 'AdminChanged');
            expect(event.args.newAdmin).to.equal(secondOwner);
        });
    });

    describe('Failure States', async () => {
        it('should fail to change admin if called by non-admin', async () => {
            await truffleAssert.reverts(proxyContract.changeAdmin(secondOwner, {
                from: nonOwner,
            }));
        });
    });
});
