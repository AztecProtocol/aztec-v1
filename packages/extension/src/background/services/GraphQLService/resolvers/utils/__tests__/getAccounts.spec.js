import expectErrorResponse from '~testHelpers/expectErrorResponse';
import {
    randomId,
} from '~/utils/random';
import * as storage from '~utils/storage';
import * as fetchAztecAccount from '../fetchAztecAccount';
import getAccounts from '../getAccounts';
import storyOf from './helpers/stories';

jest.mock('~utils/storage');

beforeEach(() => {
    storage.reset();
});

describe('getAccounts', () => {
    const addresses = [
        `0x${randomId(40)}`,
        `0x${randomId(40)}`,
    ];

    const querySpy = jest.spyOn(fetchAztecAccount, 'default')
        .mockImplementation(({
            address,
        }) => ({
            account: {
                address,
                linkedPublicKey: `linked_public_key_${address}`,
                spendingPublicKey: `spending_public_key_${address}`,
            },
        }));

    beforeEach(() => {
        querySpy.mockClear();
    });

    afterAll(() => {
        querySpy.mockRestore();
    });

    it('return an array of registered accounts', async () => {
        const response = await storyOf('ensureDomainPermission', getAccounts, {
            where: {
                address_in: addresses,
            },
        });

        expect(response).toEqual(addresses.map(address => ({
            id: address,
            address,
            linkedPublicKey: `linked_public_key_${address}`,
            spendingPublicKey: `spending_public_key_${address}`,
        })));
    });

    it('throw an error if at least one account is not found on chain', async () => {
        querySpy.mockImplementationOnce(() => ({
            account: null,
        }));

        const errorResponse = await expectErrorResponse(async () => storyOf(
            'ensureDomainPermission',
            getAccounts,
            {
                where: {
                    address_in: addresses,
                },
            },
        )).toBe('account.not.linked');

        expect(errorResponse).toMatchObject({
            addresses: [addresses[0]],
        });
    });

    it('throw an error if at least one account has no linkedPublicKey on chain', async () => {
        querySpy.mockImplementationOnce(address => ({
            account: ({
                address,
                linkedPublicKey: '',
                spendingPublicKey: '',
            }),
        }));

        const errorResponse = await expectErrorResponse(async () => storyOf(
            'ensureDomainPermission',
            getAccounts,
            {
                where: {
                    address_in: addresses,
                },
            },
        )).toBe('account.not.linked');

        expect(errorResponse).toMatchObject({
            addresses: [addresses[0]],
        });
    });
});
