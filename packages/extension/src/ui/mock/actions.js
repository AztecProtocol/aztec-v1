import {
    addresses,
    domains,
} from './data';

export default [
    {
        type: 'extension.not.registered',
        data: {
            address: addresses[1],
        },
    },
    {
        type: 'account.not.register',
        data: {
            address: addresses[1],
        },
    },
    {
        type: 'domain.not.register',
        data: {
            domain: domains[0],
        },
    },
];
