const chai = require('chai');
const crypto = require('crypto');

const { clear } = require('../../db');

const transactions = require('./controller');
const { TX_TYPES, TX_STATUS } = require('../../config');

const { expect } = chai;

describe('transactions controller tests', () => {
    describe('success states', async () => {
        beforeEach(() => {
            clear();
        });

        it('can read and write', async () => {
            const transactionHash = `0x${crypto.randomBytes(32).toString('hex')}`;
            const expected = transactions.newTransaction(TX_TYPES.ERC20_MINT, transactionHash);
            const result = transactions.get(transactionHash);
            expect(expected.status).to.equal(TX_STATUS.SENT);
            expect(expected.transactionType).to.equal(result.transactionType);
            expect(expected.transactionHash).to.equal(result.transactionHash);
        });

        it('can update', async () => {
            const transactionHash = `0x${crypto.randomBytes(32).toString('hex')}`;
            transactions.newTransaction(TX_TYPES.ERC20_MINT, transactionHash);
            transactions.updateMinedTransaction(transactionHash, { foo: 'bar' });
            const result = transactions.get(transactionHash);
            expect(result.status).to.equal(TX_STATUS.MINED);
            expect(result.transactionReceipt.foo).to.equal('bar');
        });
    });

    describe('failure states', () => {
        beforeEach(() => {
            clear();
        });
        it('cannot create transaction with invalid type', () => {
            let message = '';
            try {
                transactions.newTransaction('foo', '0x');
            } catch (e) {
                ({ message } = e);
            }
            expect(message).to.equal('foo is not a valid transaction type!');
        });

        it('cannot create transaction that already exists in databqase', () => {
            const transactionHash = `0x${crypto.randomBytes(32).toString('hex')}`;
            transactions.newTransaction(TX_TYPES.ERC20_MINT, transactionHash);
            let message = '';
            try {
                transactions.newTransaction(TX_TYPES.ERC20_MINT, transactionHash);
            } catch (e) {
                ({ message } = e);
            }
            expect(message).to.equal(`transaction ${transactionHash} already exists`);
        });

        it('cannot get transaction receipt of nonexistant transaction', async () => {
            let message = '';
            try {
                await transactions.getTransactionReceipt('0xabcdef');
            } catch (e) {
                ({ message } = e);
            }
            expect(message).to.equal('could not find transaction 0xabcdef');
        });
    });
});
