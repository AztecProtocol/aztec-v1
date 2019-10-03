import ConnectionService from '~ui/services/ConnectionService';

export default async function signNotes({
    sender,
    assetAddress,
    proof,
    requestId,
}) {
    const noteHashes = proof.notes.map(({ noteHash }) => noteHash);
    const challenge = proof.challengeHex;

    const {
        signatures,
    } = await ConnectionService.post({
        action: 'metamask.eip712.signNotes',
        requestId,
        data: {
            noteHashes,
            assetAddress,
            challenge,
            sender,
        },
    });

    return {
        signatures: signatures.reduce((accum, sig) => accum + sig.slice(2), '0x'),
    };
}
