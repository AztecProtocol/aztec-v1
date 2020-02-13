import parseInputInteger from './parseInputInteger';

export default function parseInputTransactions(transactions) {
    if (!Array.isArray(transactions)) {
        return transactions;
    }

    return transactions.map(tx => ({
        ...tx,
        amount: parseInputInteger(tx.amount),
    }));
}
