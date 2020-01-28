import ConnectionService from '~/ui/services/ConnectionService';

export default async function signNotes({
    inputNotes,
    sender,
    assetAddress,
    proof,
}) {
    const noteHashes = inputNotes.map(({ noteHash }) => noteHash);
    const challenge = proof.challengeHex;
    const {
        signatures,
        error,
    } = await ConnectionService.post({
        action: 'metamask.eip712.signNotes',
        data: {
            noteHashes,
            assetAddress,
            challenge,
            sender,
        },
    });

    if (error) {
        return {
            error,
        };
    }

    return {
        signatures: signatures.reduce((accum, sig) => {
            const fullSig = sig.padEnd(194, '0');
            return `${accum}${fullSig.slice(2)}`;
        }, '0x'),
    };
}
