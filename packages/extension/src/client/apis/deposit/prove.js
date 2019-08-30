import query from '~client/utils/query';

export default async function proveDeposit({
    amount,
    from,
    sender,
    numberOfOutputNotes,
}) {
    console.log({

        amount,
        from,
        sender,
        numberOfOutputNotes,
    });
    const data = await query({
        type: 'createAndSendDepositProof',
        args: {
            amount,
            from,
            sender,
            numberOfOutputNotes,
        },
    }) || {};

    return data;
}
