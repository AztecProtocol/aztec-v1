import parseInputInteger from './parseInputInteger';

export default function parseInputTransactions(transactions) {
    if (!Array.isArray(transactions)) {
        return transactions;
    }

    return transactions.map(({
        amount,
        numberOfOutputNotes,
        aztecAccountNotRequired,
        ...tx
    }) => ({
        ...tx,
        amount: parseInputInteger(amount),
        numberOfOutputNotes: parseInputInteger(numberOfOutputNotes),
        aztecAccountNotRequired: aztecAccountNotRequired || false,
    }));
}
