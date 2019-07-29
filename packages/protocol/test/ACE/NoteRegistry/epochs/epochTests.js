/* eslint-disable prefer-destructuring */
/* global artifacts, expect, it, contract */
// ### External Dependencies
const fs = require('fs');
const path = require('path');
const truffleAssert = require('truffle-assertions');
const { constants: { addresses } } = require('@aztec/dev-utils');


contract('Verify inherritance of behaviour contracts', (accounts) => {

    let inherritanceObj;
    let epochs;
    let sortedEpochs;
    const [owner, newOwner, attacker] = accounts;

    before(async () => {
        const dirPath = path.join(__dirname, '../../../..', 'contracts', 'ACE', 'noteRegistry', 'epochs');
        epochs = await fs.readdirSync(dirPath);
        sortedEpochs = epochs
            .map(e => parseInt(e, 10))
            .sort()
            .map(e => e.toString())
            .splice(1);

        inherritanceObj = epochs.reduce((acc, epoch) => {
            const behaviourPath = path.join(dirPath, epoch, 'Behaviour.sol');
            const contract = fs.readFileSync(behaviourPath, 'utf-8');

            const regexMatch = contract.match(/contract (.*) is (.*) \{/);
            const contractName = regexMatch[1];
            const inherritedBehaviour = regexMatch[2].split(',').find(c => (/[bB]ehaviour/).test(c));
            acc[epoch] = {
                epochInt: parseInt(epoch, 10),
                contractName,
                inherritedBehaviour,
                behaviourPath,
            }
            return acc;
        }, {});

    });

    describe('Success States', async () => {
        it('should inherrit from previous generation', () => {
            sortedEpochs.forEach(epoch => {
                const epochObj = inherritanceObj[epoch];
                const previousEpoch = (epochObj.epochInt - 1).toString();
                expect(RegExp(epoch).test(epochObj.contractName)).to.equal(true);
                expect(RegExp(previousEpoch).test(epochObj.inherritedBehaviour)).to.equal(true);
            });
        });

        it('should always set initialised flag and transfer ownership when initialise() is called once', async () => {
            await Promise.all(epochs.map(async (epoch) => {
                const { contractName } = inherritanceObj[epoch];
                const artifactsPath = `./ACE/noteRegistry/epochs/${epoch}/${contractName}`;
                const Contract = artifacts.require(artifactsPath);
                const contract = await Contract.new({
                    from: owner,
                });

                const flagPreInitialise = await contract.initialised();
                expect(flagPreInitialise).to.equal(false);
                await contract.initialise(
                    newOwner,
                    addresses.ZERO_ADDRESS,
                    1,
                    true,
                    false,
                    { from: owner }
                );
                const flagPostInitialise = await contract.initialised();
                expect(flagPostInitialise).to.equal(true);
                const ownerPostInitialise = await contract.owner();
                expect(ownerPostInitialise).to.equal(newOwner);

                await truffleAssert.reverts(contract.initialise(
                    attacker,
                    addresses.ZERO_ADDRESS,
                    1,
                    true,
                    false,
                    { from: attacker }
                ));

                await truffleAssert.reverts(contract.initialise(
                    attacker,
                    addresses.ZERO_ADDRESS,
                    1,
                    true,
                    false,
                    { from: newOwner }
                ));
            }));
        });
    });
});
