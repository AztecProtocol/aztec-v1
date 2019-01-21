/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');
const { padLeft } = require('web3-utils');

// ### Internal Dependencies
// const aztecProof = require('../../../aztec-crypto-js/proof/joinSplit');
// const abiEncoder = require('../../../aztec-crypto-js/abiEncoder');
const { t2 } = require('../../../aztec-crypto-js/params');
// const secp256k1 = require('../../../aztec-crypto-js/secp256k1');
// const sign = require('../../../aztec-crypto-js/eip712/sign');
// const note = require('../../../aztec-crypto-js/note');

// ### Artifacts
const ACE = artifacts.require('./contracts/ACE/ACE');
const AZTECJoinSplit = artifacts.require('./contracts/ACE/validators/AZTECJoinSplit/AZTECJoinSplit');
const AZTECJoinSplitInterface = artifacts.require('./contracts/ACE/validators/AZTECJoinSplit/AZTECJoinSplitInterface');

AZTECJoinSplit.abi = AZTECJoinSplitInterface.abi;


// function randomNoteValue() {
//     return Math.floor(Math.random() * Math.floor(K_MAX));
// }

const fakeNetworkId = 100;
contract.only('AZTEC Cryptography Engine', (accounts) => {
    let aztec;
    let ace;
    // let aztecAccounts = [];
    // let notes = [];

    // Creating a collection of tests that should pass
    describe('setup', () => {
        let crs;
        beforeEach(async () => {
            // aztecAccounts = [...new Array(10)].map(() => secp256k1.generateAccount());
            // notes = aztecAccounts.map(({ publicKey }) => {
            //     return note.create(publicKey, randomNoteValue());
            // });

            aztec = await AZTECJoinSplit.new(fakeNetworkId, {
                from: accounts[0],
            });
            ace = await ACE.new({ from: accounts[0] });
            const hx = new BN('7673901602397024137095011250362199966051872585513276903826533215767972925880', 10);
            const hy = new BN('8489654445897228341090914135473290831551238522473825886865492707826370766375', 10);
            crs = [
                `0x${padLeft(hx.toString(16), 64)}`,
                `0x${padLeft(hy.toString(16), 64)}`,
                ...t2,
            ];
        });

        it('can set ACE\'s common reference string', async () => {
            await ace.setCommonReferenceString(crs, {
                from: accounts[0],
            });
            const result = await ace.commonReferenceString.get();
            expect(result).to.equal(crs);
        });

        it('can set a proof', async () => {
            await ace.setProof(1, aztec.address);

            const result = ace.validators(1).get();
            expect(result).to.equal(aztec.address);
        });
    });
});
