import {
    log,
} from '~utils/log';

export default async function deposit(asset, depositAmount, options) {
    log('Generating deposit proof...');
    const depositProof = await asset.deposit(depositAmount, options);
    if (!depositProof) {
        log('Failed to generate deposit proof.');
        return null;
    }
    log(depositProof);

    return depositProof;
}
