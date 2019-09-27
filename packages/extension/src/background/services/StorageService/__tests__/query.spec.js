import StorageService from '~background/services/StorageService';


describe('query', () => {
    const rawAccount = {
        address: '0x12345678',
        linkedPublicKey: '34563',
        blockNumber: 234,
    };

    const networkId = 453;

    it('should call query for account with right params', async () => {
        // given
        const accountQueryMock = jest.spyOn(StorageService.query, 'account');

        // action
        await StorageService.query.account(networkId, rawAccount.address);
        const expected = [
            networkId,
            rawAccount.address,
        ];
        // expected
        expect(accountQueryMock).toHaveBeenCalledWith(expected[0], expected[1]);
    });
});
