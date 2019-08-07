import {
    log,
} from '~utils/log';

export default async function send(asset, sendAmount, receiver) {
    log('Generating send proof...');
    const sendProof = await asset.send({
        amount: sendAmount,
        to: receiver,
        numberOfOutputNotes: 1,
    });
    log(sendProof.export());

    log('Approving send proof...');
    await sendProof.approve();
    log('Approved!');

    log('Sending...');
    await sendProof.send();
    log(`Successfully sent ${sendAmount} to account '${receiver}'.`);
}
