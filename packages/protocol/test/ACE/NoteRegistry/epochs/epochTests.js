/* eslint-disable prefer-destructuring */
/* global  expect, it */
// ### External Dependencies
const fs = require('fs');
const path = require('path');


describe('Verify inherritance of behaviour contracts', () => {

    let inherritanceObj;
    let sortedEpochs;

    before(async () => {
        const dirPath = path.join(__dirname, '../../../..', 'contracts', 'ACE', 'noteRegistry', 'epochs');
        const epochs = await fs.readdirSync(dirPath);
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
        })
    });
});
