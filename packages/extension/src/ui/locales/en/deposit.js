export default {
    confirm: {
        title: 'Deposit',
        submit: 'Create Proof',
        explain: 'Check the above details are correct before proceeding.',
    },
    approve: {
        title: 'Approve Spend',
        submit: 'Approve',
        amount: 'Deposit',
        explain: 'To proceed, please approve the AZTEC contract to spend tokens on your behalf.',
        erc20: {
            title: 'Approve Allowance',
            amount: 'Approve AZTEC to spend %{amount} ERC20 tokens',
            submit: 'Approve',
            explain: 'To proceed, please approve the AZTEC contract to spend tokens on your behalf.',
        },
    },
    send: {
        title: 'Send Transaction',
        submit: 'Send',
        explain: 'AZTEC sends transactions through the Gas Station Network so you don\'t pay gas.',
    },
    transaction: {
        _: 'Deposit Transaction',
        description: '',
    },
    from: 'From',
    amount: {
        total: 'Total amount',
    },
    step: {
        approve: {
            erc20: 'Approve ERC20',
        },
        proof: {
            create: 'Create Proof',
        },
    },
};
