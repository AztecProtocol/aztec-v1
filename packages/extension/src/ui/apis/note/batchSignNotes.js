import ConnectionService from '~/ui/services/ConnectionService';

export default async function batchSignNotes({
    inputNotes,
    sender,
    assetAddress,
}) {
    const noteHashes = inputNotes.map(({ noteHash }) => noteHash) || [];
    const {
        signature,
    } = await ConnectionService.post({
        action: 'metamask.eip712.batchSignNotes',
        data: {
            noteHashes,
            assetAddress,
            sender,
        },
    });

    return {
        noteHashes,
        spender: sender,
        spenderApprovals: noteHashes.map(() => true),
        signature,
    };
}
