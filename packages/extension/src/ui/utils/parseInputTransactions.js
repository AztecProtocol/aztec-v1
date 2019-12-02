export default function parseInputTransactions(transactions) {
    return transactions.map(({
        amount,
        to,
    }) => ({
        amount: Number(amount),
        to,
    }));
}
