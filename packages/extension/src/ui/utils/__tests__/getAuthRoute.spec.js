import {
    randomId,
} from '~/utils/random';
import getAuthRoute from '../getAuthRoute';

const currentAddress = `0x${randomId(40)}`;
const anotherAddress = `0x${randomId(40)}`;
const linkedPublicKey = `0x${randomId(40)}`;
const anotherLinkedPublicKey = `0x${randomId(40)}`;

describe('getAuthRoute with no on chain account', () => {
    const onChainLinkedPublicKey = '';

    it('return `register` if there is no account in local storage', () => {
        expect(getAuthRoute({
            currentAddress,
            onChainLinkedPublicKey,
            validSession: false,
            localAddress: '',
            localLinkedPublicKey: '',
        })).toBe('register');
    });

    it('return `link` if there is an account in local storage and the session is valid', () => {
        expect(getAuthRoute({
            currentAddress,
            onChainLinkedPublicKey,
            validSession: true,
            localAddress: currentAddress,
            localLinkedPublicKey: linkedPublicKey,
        })).toBe('register.address');

        expect(getAuthRoute({
            currentAddress,
            onChainLinkedPublicKey,
            validSession: true,
            localAddress: anotherAddress,
            localLinkedPublicKey: anotherLinkedPublicKey,
        })).toBe('register.address');
    });

    it('return `register` if there is an account in local storage but the session has expired', () => {
        expect(getAuthRoute({
            currentAddress,
            onChainLinkedPublicKey,
            validSession: false,
            localAddress: currentAddress,
            localLinkedPublicKey: linkedPublicKey,
        })).toBe('register');

        expect(getAuthRoute({
            currentAddress,
            onChainLinkedPublicKey,
            validSession: false,
            localAddress: anotherAddress,
            localLinkedPublicKey: anotherLinkedPublicKey,
        })).toBe('register');
    });
});

describe('getAuthRoute with on chain account', () => {
    const onChainLinkedPublicKey = linkedPublicKey;

    it('return `restore` if there is no account in local storage', () => {
        expect(getAuthRoute({
            currentAddress,
            onChainLinkedPublicKey,
            validSession: false,
            localAddress: '',
            localLinkedPublicKey: '',
        })).toBe('account.restore');
    });

    it('return `restore` if there is another account in local storage', () => {
        expect(getAuthRoute({
            currentAddress,
            onChainLinkedPublicKey,
            validSession: true,
            localAddress: anotherAddress,
            localLinkedPublicKey: anotherLinkedPublicKey,
        })).toBe('account.restore');

        expect(getAuthRoute({
            currentAddress,
            onChainLinkedPublicKey,
            validSession: false,
            localAddress: anotherAddress,
            localLinkedPublicKey: anotherLinkedPublicKey,
        })).toBe('account.restore');
    });

    it('return `restore` if account is in local storage but has different linkedPublicKey', () => {
        expect(getAuthRoute({
            currentAddress,
            onChainLinkedPublicKey,
            validSession: false,
            localAddress: currentAddress,
            localLinkedPublicKey: anotherLinkedPublicKey,
        })).toBe('account.restore');
    });

    it('return `login` if account is in local storage but the session has expired', () => {
        expect(getAuthRoute({
            currentAddress,
            onChainLinkedPublicKey,
            validSession: false,
            localAddress: currentAddress,
            localLinkedPublicKey: onChainLinkedPublicKey,
        })).toBe('account.login');
    });
});
