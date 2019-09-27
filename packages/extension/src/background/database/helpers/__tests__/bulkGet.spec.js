import Account from '~background/database/models/account';
import clearDB from '~background/database/utils/clearDB';

describe('bulkGet', () => {
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

    it.skip('should retrive several items by keys', async () => {
        // given
        await Account.add(rawAccountBlock_2, { networkId });
        await Account.add(rawAccountBlock_1, { networkId });
        await Account.add(rawAccountBlock_4, { networkId });
        await Account.add(rawAccountBlock_3, { networkId });

        // actiion
        const keys = [rawAccountBlock_2.address, rawAccountBlock_1.address, '0xsome_non_existing_address', rawAccountBlock_3.address];
        const accounts = await Account.bulkGet({ networkId }, keys);

        // expected
        expect(accounts.length).toEqual(4);
    });
});
