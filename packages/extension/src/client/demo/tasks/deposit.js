import {
    log,
} from '~utils/log';

export default async function deposit(asset, depositAmount) {
    log('Generating deposit proof...');
    const depositProof = await asset.deposit(depositAmount);
    if (!depositProof) {
        log('Failed to generate deposit proof.');
        return null;
    }
    // log(depositProof.export());

    // log('Approving deposit...');
    // await depositProof.approve();
    // log('Approved!');

    // log('Making deposit...');
    // const depositedNotes = await depositProof.send();
    // log(`Successfully deposited ${depositAmount}!`, {
    //     notes: depositedNotes,
    // });

    // return depositedNotes;
}
