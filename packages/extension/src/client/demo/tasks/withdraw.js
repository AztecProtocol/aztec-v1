import {
    log,
} from '~utils/log';

export default async function withdraw(asset, withdrawAmount, {
    numberOfInputNotes = 1,
} = {}) {
    log('Generating withdraw proof...');
    const withdrawProof = await asset.withdraw(withdrawAmount, {
        numberOfInputNotes,
    });
    if (!withdrawProof) {
        log('Failed to generate withdraw proof');
        return;
    }
    log(withdrawProof.export());

    log('Approving withdrawal...');
    await withdrawProof.approve();
    log('Approved!');

    log('Withdrawing...');
    await withdrawProof.send();
    log(`Successfully withdrew ${withdrawAmount}!`);
}
