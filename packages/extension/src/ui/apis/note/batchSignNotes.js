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
    const {
        isGSNAvailable,
        proxyContract,
    } = gsnConfig;
    const actualSpender = isGSNAvailable ? proxyContract : sender;

    const {
        signature,
    } = await ConnectionService.post({
        action: 'metamask.eip712.batchSignNotes',
        requestId,
        data: {
            noteHashes,
            assetAddress,
            sender: actualSpender,
        },
    });

    return {
        signature,
    };
}
