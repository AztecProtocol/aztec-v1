/* eslint-disable prefer-destructuring */
/* global artifacts, expect, contract, beforeEach, it, web3:true */
// ### External Dependencies
const BN = require('bn.js');

// ### Internal Dependencies
/* eslint-disable-next-line object-curly-newline */
const { constants: { addresses }, proofs } = require('@aztec/dev-utils');

// ### Artifacts
const NoteRegistryData = artifacts.require('./noteRegistry/epochs/201907/Data201907');
const NoteRegistryBehaviour = artifacts.require('./noteRegistry/epochs/201907/convertible/BehaviourConvert201907');
const NoteRegistryFactory = artifacts.require('./noteRegistry/epochs/201907/convertible/FactoryConvertible201907');


const { BOGUS_PROOF, JOIN_SPLIT_PROOF } = proofs;

contract('NoteRegistryFactory', (accounts) => {
    const [owner] = accounts;
    const scalingFactor = new BN(1);

    let factoryContract;

    beforeEach(async () => {
        factoryContract = await NoteRegistryFactory.new();
    });

    describe('Success States', async () => {
        it('should successfully deploy note registry and assign ownership', async () => {
            const receipt = await factoryContract.deployNewNoteRegistry(
                addresses.ZERO_ADDRESS,
                scalingFactor,
                false,
                true,
                {
                    from: owner,
                }
            );
            const event = receipt.logs.find(l => l.event === 'NoteRegistryDeployed');
            const behaviourContract = await NoteRegistryBehaviour.at(event.args.behaviourContract);
            const behaviourContractOwner = await behaviourContract.owner();
            expect(behaviourContractOwner).to.equal(owner);

            const dataContractAddress = await behaviourContract.noteRegistryData();
            const dataContract = await NoteRegistryData.at(dataContractAddress);
            const dataContractOwner = await dataContract.owner();
            expect(dataContractOwner).to.equal(behaviourContract.address);
        });

        it('should successfully deploy new behaviour contract and assign ownership', async () => {
            const receipt = await factoryContract.deployNewNoteRegistry(
                addresses.ZERO_ADDRESS,
                scalingFactor,
                false,
                true,
                {
                    from: owner,
                }
            );
            const event = receipt.logs.find(l => l.event === 'NoteRegistryDeployed');
            const behaviourContract = await NoteRegistryBehaviour.at(event.args.behaviourContract);

            const dataContractAddress = await behaviourContract.noteRegistryData();
            const updateReceipt = await factoryContract.deployNewBehaviourInstance(dataContractAddress);

            const newEvent = updateReceipt.logs.find(l => l.event === 'NoteRegistryDeployed');
            const newBehaviourContract = await NoteRegistryBehaviour.at(newEvent.args.behaviourContract);

            const newBehaviourOwner = await newBehaviourContract.owner();
            expect(newBehaviourOwner).to.equal(owner);
        });
    });
});
