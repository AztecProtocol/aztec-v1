import ConnectionService from '~ui/services/ConnectionService';

export default async function signNotes({
    inputNotes,
    sender,
    assetAddress,
    requestId,
    gsnConfig,
}) {
    const noteHashes = inputNotes.map(({ noteHash }) => noteHash);
    const {
        isGSNAvailable,
        proxyContract,
    } = gsnConfig;
    const actualSpender = isGSNAvailable ? proxyContract : sender;
    console.log({ actualSpender, isGSNAvailable });

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
    console.log({ signature });

    return {
        signature,
    };
}
