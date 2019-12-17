import {
    createBulkAccounts,
} from '..';
import Account from '~/background/database/models/account';
import clearDB from '~/background/database/utils/clearDB';


describe('createBulkAccount', () => {
    const rawAccounts = [
        {
            address: '0x01',
            linkedPublicKey: '0xff',
            blockNumber: 25,
        },
        {
            address: '0x02',
            linkedPublicKey: '0x02',
            blockNumber: 26,
        },
    ];

    afterEach(async () => {
        clearDB();
    });

    it('should insert two unique Account with right fields', async () => {
        // given
        const accountsBefore = await Account.query({ networkId: 0 }).toArray();
        expect(accountsBefore.length).toEqual(0);

        // action
        await createBulkAccounts(rawAccounts, 0);

        // expected
        const accountsAfter = await Account.query({ networkId: 0 }).toArray();

        expect(accountsAfter.length).toEqual(rawAccounts.length);
        expect(accountsAfter[0]).toMatchObject(rawAccounts[0]);
        expect(accountsAfter[1]).toMatchObject(rawAccounts[1]);
    });
});
