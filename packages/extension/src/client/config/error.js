export default {
    erc20: {
        balanceOf: "Cannot get balance of linked token for account '%{account}'.",
        allowance: "Cannot get allowance of linked token for account '%{account}'.",
        totalSupply: 'Failed to get total supply of linked token.',
    },
    zkAsset: {
        private: "Cannot call '%{fn}' on private asset.",
    },
    account: {
        not: {
            registered: 'The user has not setup the AZTEC extension.',
        },
    },
    user: {
        unregistered: "Cannot call '%{fn}' on unregistered user.",
        logout: "'%{fn}' can only be called on current logged in account.",
    },
    input: {
        contract: {
            address: {
                empty: {
                    _: 'Please provide valid addresses for contracts %{contractName}',
                    1: 'Please provide an address for contract %{contractName}',
                },
            },
        },
        address: {
            not: {
                valid: 'Input address not valid.',
            },
        },
        amount: {
            not: {
                match: {
                    transaction: 'Input amount does not match total transactions.',
                },
            },
        },
        note: {
            not: {
                defined: 'Input note cannot be empty.',
                valid: 'Input note is not a valid AZTEC note.',
                eq: 'Target note value should be equal to its comparison note value.',
                gt: 'Target note value should be greater than its comparison note value.',
                gte: 'Target note value should be greater than or equal to its comparison note value.',
                lt: 'Target note value should be less than its comparison note value.',
                lte: 'Target note value should be less than or equal to its comparison note value.',
            },
        },
        remainderNote: {
            wrong: {
                type: 'Remainder note is not a valid AZTEC note',
                value: 'Remainder note has incorrect value.',
            },
        },
    },
};
