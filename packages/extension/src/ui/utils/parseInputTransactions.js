import parseInputAmount from './parseInputAmount';

export default function parseInputTransactions(transactions) {
    return transactions.map(({
        amount,
        to,
    }) => ({
        amount: parseInputAmount(amount),
        to,
    }));
}
