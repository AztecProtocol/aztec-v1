/* eslint-disable no-param-reassign */
/* eslint-disable prefer-destructuring */
/* global artifacts, expect, it, contract */
// ### External Dependencies
const fs = require('fs');
const path = require('path');
const truffleAssert = require('truffle-assertions');

function findBehaviourContracts(epochPath) {
    const paths = fs.readdirSync(epochPath);
    const contractPaths = paths.filter((p) => /.*[bB]ehaviour.*\.sol/.test(p)).map((c) => path.join(epochPath, c));
    const dirPaths = paths.filter((p) => !/.*\.sol/.test(p)).map((d) => path.join(epochPath, d));

    return contractPaths.concat(
        dirPaths
            .map((p) => {
                if (/\.DS_Store/.test(p)) return [];
                return findBehaviourContracts(p);
            })
            .reduce((acc, a) => {
                return acc.concat(a);
            }, []),
    );
}

function fetchAllBehaviourData(dirPath) {
    const behaviourPaths = findBehaviourContracts(dirPath);

    const newBehaviours = behaviourPaths.reduce((behaviours, behaviourPath) => {
        const epoch = behaviourPath.match(/.*epochs\/(\d+).*/)[1];
        const contract = fs.readFileSync(behaviourPath, 'utf-8');
        const regexMatch = contract.match(/contract (.*) is (.*) \{/);
        const contractName = regexMatch[1];
        const inherritedBehaviours = regexMatch[2].split(',').filter((c) => /[bB]ehaviour/.test(c));

        behaviours[contractName] = {
            next: [],
            previous: inherritedBehaviours,
            ...behaviours[contractName],
            epochInt: parseInt(epoch, 10),
            contractName,
            behaviourPath,
        };

        inherritedBehaviours.forEach((inherritedBehaviour) => {
            if (behaviours[inherritedBehaviour]) {
                behaviours[inherritedBehaviour].next.push(contractName);
            } else {
                behaviours[inherritedBehaviour] = {
                    next: [contractName],
                    epochInt: 0,
                    previous: [],
                };
            }
        });
        return behaviours;
    }, {});

    return newBehaviours;
}

async function assessProperInitialisation(obj, inherritanceObj, accounts) {
    const [owner, newOwner, attacker] = accounts;

    const { behaviourPath, contractName, next } = obj;
    if (behaviourPath) {
        const [, baseArtifactsPath] = behaviourPath.match(/.*contracts\/(.*)\/.*Behaviour.*/);
        const artifactsPath = `./${baseArtifactsPath}/${contractName}`;
        const Contract = artifacts.require(artifactsPath);
        const contract = await Contract.new({
            from: owner,
        });

        const flagPreInitialise = await contract.initialised();
        expect(flagPreInitialise).to.equal(false);
        await contract.initialise(newOwner, 1, true, false, { from: owner });
        const flagPostInitialise = await contract.initialised();
        expect(flagPostInitialise).to.equal(true);
        const ownerPostInitialise = await contract.owner();
        expect(ownerPostInitialise).to.equal(newOwner);

        await truffleAssert.reverts(contract.initialise(attacker, 1, true, false, { from: attacker }));

        await truffleAssert.reverts(contract.initialise(attacker, 1, true, false, { from: newOwner }));
    }
    return next;
}

contract('Verify inherritance of behaviour contracts', (accounts) => {
    let inherritanceObj;
    let orderedEpochs;

    before(async () => {
        const dirPath = path.join(__dirname, '../../../..', 'contracts', 'ACE', 'noteRegistry', 'epochs');

        inherritanceObj = fetchAllBehaviourData(dirPath);
        const orderedEpochSet = new Set(
            Object.values(inherritanceObj)
                .map((o) => o.epochInt)
                .sort(),
        );

        orderedEpochs = Array.from(orderedEpochSet);
    });

    describe('Success States', async () => {
        it('should inherrit from previous generation', () => {
            /**
             * We are testing that in the inherritance tree, no node at level n inherrits directly from any
             * node at level n - 2 or greater.
             * In effect, we want to ensure that the tree looks like:
             *
             *        [*]                            [*]      | Epoch 1
             *        / \                            / \      |
             *      [*] [*]    and never like      [*]  \     | Epoch 2
             *           |                         /     \    |
             *           [*]                     [*]    [*]   | Epoch 3
             *
             * This is to ensure that no new epoch does not contain variables declared in prior epochs.
             */
            function assessProperInherritance(obj) {
                const { epochInt, previous, next } = obj;
                const epochIndex = orderedEpochs.indexOf(epochInt);
                if (next.length === 0) return;
                if (epochIndex !== 0) {
                    const parent = previous.find((c) => inherritanceObj[c].epochInt === orderedEpochs[epochIndex - 1]);
                    expect(parent).to.not.equal(undefined);
                }

                next.forEach((c) => {
                    assessProperInherritance(inherritanceObj[c]);
                });
            }
            // Getting the root
            const NoteRegistryBehaviour = inherritanceObj.NoteRegistryBehaviour;
            assessProperInherritance(NoteRegistryBehaviour);
        });

        it('should always set initialised flag and transfer ownership when initialise() is called once', async () => {
            // Getting the root
            const NoteRegistryBehaviour = inherritanceObj.NoteRegistryBehaviour;
            const next = await assessProperInitialisation(NoteRegistryBehaviour, inherritanceObj, accounts);
            await Promise.all(
                next.map(async (c) => {
                    return assessProperInitialisation(inherritanceObj[c], inherritanceObj, accounts);
                }),
            );
        });
    });
});
