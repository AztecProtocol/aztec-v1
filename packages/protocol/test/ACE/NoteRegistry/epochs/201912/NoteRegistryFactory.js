/* eslint-disable prefer-destructuring */
/* global artifacts, expect, contract, beforeEach, it */
// ### External Dependencies

// ### Internal Dependencies
/* eslint-disable-next-line object-curly-newline */
const truffleAssert = require('truffle-assertions');

// ### Artifacts
const NoteRegistryBehaviour = artifacts.require('./noteRegistry/epochs/201912/base/BehaviourBase201912');
const NoteRegistryFactory = artifacts.require('./noteRegistry/epochs/201912/base/FactoryBase201912');

contract('NoteRegistryFactory', (accounts) => {
    const [owner, notOwner] = accounts;

    let factoryContract;

    beforeEach(async () => {
        factoryContract = await NoteRegistryFactory.new(owner);
    });

    describe('Success States', async () => {
        it('should successfully deploy note registry', async () => {
            const receipt = await factoryContract.deployNewBehaviourInstance({
                from: owner,
            });
            const event = receipt.logs.find((l) => l.event === 'NoteRegistryDeployed');
            const behaviourContract = await NoteRegistryBehaviour.at(event.args.behaviourContract);
            expect(behaviourContract).to.not.equal(undefined);
        });
    });

    describe('Failure States', async () => {
        it('should fail to deploy note registry if not owner', async () => {
            await truffleAssert.reverts(
                factoryContract.deployNewBehaviourInstance({
                    from: notOwner,
                }),
            );
        });
    });
});
