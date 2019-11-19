import ConnectionService from '~ui/services/ConnectionService';

export default async function signNotes({
    inputNotes,
    sender,
    assetAddress,
    proof,
    requestId,
    gsnConfig,
}) {
    const noteHashes = inputNotes.map(({ noteHash }) => noteHash);
    const challenge = proof.challengeHex;
    const {
        isGSNAvailable,
        proxyContract,
    } = gsnConfig;
    const actualSpender = isGSNAvailable ? proxyContract : sender;

    const {
        signatures,
    } = await ConnectionService.post({
        action: 'metamask.eip712.signNotes',
        requestId,
        data: {
            noteHashes,
            assetAddress,
            challenge,
            sender: actualSpender,
        },
    });

    return {
        signatures: signatures.reduce((accum, sig) => {
            const fullSig = sig.padEnd(194, '0');
            return `${accum}${fullSig.slice(2)}`;
        }, '0x'),
    };
}
