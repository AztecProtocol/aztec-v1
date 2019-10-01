import {
    log,
} from '~utils/log';

export default async function withdraw(asset, withdrawAmount, {
    numberOfInputNotes = 1,
    to,
    from,
    sender,
} = {}) {
    log('Generating withdraw proof...');
    const withdrawProof = await asset.withdraw(withdrawAmount, {
        numberOfInputNotes,
        to,
        from,
        sender,
    });
    if (!withdrawProof) {
        log('Failed to generate withdraw proof');
        return;
    }
    log(withdrawProof.export());

    log(`Successfully withdrew ${withdrawAmount}!`);
}
