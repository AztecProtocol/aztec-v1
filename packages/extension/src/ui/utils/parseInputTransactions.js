import parseInputAmount from './parseInputAmount';

export default function parseInputTransactions(transactions) {
    return transactions.map(({
        amount,
        to,
        ...rest
    }) => ({
        ...rest,
        amount: parseInputAmount(amount),
        to,
    }));
}
