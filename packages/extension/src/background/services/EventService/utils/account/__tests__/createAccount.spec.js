import {
    createAccount,
} from '..';
import Account from '~background/database/models/account';
import {
    clearDB,
} from '~background/database';


describe('createAccount', () => {
    const rawAccount = {
        address: '0x12345678',
        linkedPublicKey: '34563',
        blockNumber: 234,
    };

    afterEach(async () => {
        clearDB();
    });

    it('should insert new account with right fields', async () => {
        // given
        const acccountsBefore = await Account.query().toArray();
        expect(acccountsBefore.length).toEqual(0);

        // action
        await createAccount(rawAccount);

        // expected
        const accountsAfter = await Account.query().toArray();
        const accountExpected = {
            ...rawAccount,
        };

        expect(accountsAfter.length).toEqual(1);
        expect(accountsAfter[0]).toEqual(accountExpected);
    });
});
