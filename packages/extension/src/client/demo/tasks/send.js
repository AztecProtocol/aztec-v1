import {
    log,
} from '~utils/log';

export default async function send(asset, transactions, options) {
    log('Generating send proof...');
    const sendProof = await asset.send(transactions, options);
    log(sendProof.export());
    transactions.forEach(({ amount, to }) => {
        log(`Successfully sent ${amount} to account '${to}'.`);
    });
}
