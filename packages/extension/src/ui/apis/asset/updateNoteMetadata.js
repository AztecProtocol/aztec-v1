import ConnectionService from '~/ui/services/ConnectionService';

export default async function updateNoteMetadata({
    asset,
    note,
    metadata,
}) {
    const {
        address: assetAddress,
    } = asset;
    const {
        noteHash,
    } = note;

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
