import Account from '~background/database/models/account';
import {
    clearDB
} from '~background/database';

describe('lates', () => {

    const rawAccountBlock_1 = {
        address: '0x01',
        linkedPublicKey: '0xff',
        blockNumber: 1,
    };

    const rawAccountBlock_2 = {
        address: '0x02',
        linkedPublicKey: '0xff',
        blockNumber: 2,
    };

    const rawAccountBlock_3 = {
        address: '0x03',
        linkedPublicKey: '0x32sfffs',
        blockNumber: 3,
    };

    const rawAccountBlock_4 = {
        address: '0x04',
        linkedPublicKey: '0x32ffffs',
        blockNumber: 4,
    };

    const networkId = 1;


    beforeEach(() => {
        clearDB();
    });

    it('should retrive last item without filtering', async () => {
        // given
        await Account.add(rawAccountBlock_2, {networkId});
        await Account.add(rawAccountBlock_1, {networkId});
        await Account.add(rawAccountBlock_4, {networkId});
        await Account.add(rawAccountBlock_3, {networkId});

        const accounts = await Account.query({networkId}).toArray();
        expect(accounts.length).toEqual(4);

        // expected
        const accountExpected = await Account.latest({networkId}, {orderBy: 'blockNumber'});
        expect(accountExpected).toEqual(rawAccountBlock_4);
    });

    it('should retrive last item without filtering and specifying orderBy param', async () => {
        // given
        await Account.add(rawAccountBlock_2, {networkId});
        await Account.add(rawAccountBlock_1, {networkId});
        await Account.add(rawAccountBlock_4, {networkId});
        await Account.add(rawAccountBlock_3, {networkId});

        const accounts = await Account.query({networkId}).toArray();
        expect(accounts.length).toEqual(4);

        // expected
        const accountExpected = await Account.latest({networkId});
        expect(accountExpected).toEqual(rawAccountBlock_4);
    });

    it('should retrive last item with filtering', async () => {
        // given
        await Account.add(rawAccountBlock_2, {networkId});
        await Account.add(rawAccountBlock_1, {networkId});
        await Account.add(rawAccountBlock_4, {networkId});
        await Account.add(rawAccountBlock_3, {networkId});

        const accounts = await Account.query({networkId}).toArray();
        expect(accounts.length).toEqual(4);

        // expected
        const accountExpected = await Account.latest({ 
            networkId 
        },
        {
            filterOptions: {
                address: rawAccountBlock_3.address
            }
        });
        expect(accountExpected).toEqual(rawAccountBlock_3);
    });


    it('should retrive last item with filtering by address', async () => {
        // given
        const account = {

        };
        await Account.add(account, {networkId});

        const accounts = await Account.query({networkId: 0}).toArray();
        expect(accounts.length).toEqual(1);

        // expected
        const accountExpected = await Account.latest({ 
            networkId 
        },
        {
            filterOptions: {
                address: rawAccountBlock_3.address
            }
        });
        expect(accountExpected).toEqual(rawAccountBlock_3);
    });

})