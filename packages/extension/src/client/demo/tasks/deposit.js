import {
    log,
} from '~utils/log';

export default async function deposit(asset, transactions, options) {
    log('Generating deposit proof...');
    const depositProof = await asset.deposit(transactions, options);
    if (!depositProof) {
        log('Failed to generate deposit proof.');
        return null;
    }
    log(depositProof);

    return depositProof;
}
