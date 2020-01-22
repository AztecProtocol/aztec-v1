import ConnectionService from '~/ui/services/ConnectionService';

export default async function batchSignNotes({
    inputNotes,
    sender,
    assetAddress,
}) {
    const noteHashes = inputNotes.map(({ noteHash }) => noteHash) || [];
    const {
        signature,
        error,
    } = await ConnectionService.post({
        action: 'metamask.eip712.batchSignNotes',
        data: {
            noteHashes,
            assetAddress,
            sender,
        },
    });

    if (error) {
        return {
            error,
        };
    }

    return {
        noteHashes,
        spender: sender,
        spenderApprovals: noteHashes.map(() => true),
        signature,
    };
}
