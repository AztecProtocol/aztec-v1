import {
    addresses,
    domains,
} from './data';

export default [
    {
        key: 'extension.not.registered',
    },
    {
        key: 'account.not.register',
        data: {
            address: addresses[1],
        },
    },
    {
        key: 'domain.not.register',
        data: {
            domain: domains[0],
        },
    },
];
