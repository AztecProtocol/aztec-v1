import ConnectionService from '~/ui/services/ConnectionService';

export default async function publicApprove({
    noteHash,
    metadata,
    assetAddress,
}) {
    const response = await ConnectionService.post({
        action: 'metamask.zkAsset.updateNoteMetadata',
        data: {
            assetAddress,
            noteHash,
            metadata,
        },
    });

    return response;
}
