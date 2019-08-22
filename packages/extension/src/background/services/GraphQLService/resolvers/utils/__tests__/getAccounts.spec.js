import expectErrorResponse from '~helpers/expectErrorResponse';
import * as storage from '~utils/storage';
import GraphNodeService from '~background/services/GraphNodeService';
import getAccounts from '../getAccounts';
import storyOf from './helpers/stories';

jest.mock('~utils/storage');

afterEach(() => {
    storage.reset();
});

describe('getAccounts', () => {
    const numberOfAccounts = 2;
    const accounts = [];
    const addresses = [];
    for (let i = 0; i < numberOfAccounts; i += 1) {
        const address = `address_${i}`;
        addresses.push(address);
        accounts.push({
            id: `account_id_${i}`,
            address,
            linkedPublicKey: `linked_public_key_${i}`,
        });
    }

    const querySpy = jest.spyOn(GraphNodeService, 'query')
        .mockImplementation(() => ({
            accounts,
        }));

    afterEach(() => {
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

        expect(response).toEqual(accounts);
    });

    it('throw an error if at least one account is not found on chain', async () => {
        const errorResponse = await expectErrorResponse(async () => storyOf(
            'ensureDomainPermission',
            getAccounts,
            {
                where: {
                    address_in: [
                        ...addresses,
                        'stranger_address',
                    ],
                },
            },
        )).toBe('account.not.linked');

        expect(errorResponse).toMatchObject({
            invalidAccounts: ['stranger_address'],
        });
    });

    it('throw an error if at least one account has no linkedPublicKey on chain', async () => {
        querySpy.mockImplementationOnce(() => ({
            accounts: [
                ...accounts,
                {
                    id: 'stranger',
                    address: 'stranger_address',
                    linkedPublicKey: '',
                },
            ],
        }));

        const errorResponse = await expectErrorResponse(async () => storyOf(
            'ensureDomainPermission',
            getAccounts,
            {
                where: {
                    address_in: [
                        ...addresses,
                        'stranger_address',
                    ],
                },
            },
        )).toBe('account.not.linked');

        expect(errorResponse).toMatchObject({
            invalidAccounts: ['stranger_address'],
        });
    });
});
