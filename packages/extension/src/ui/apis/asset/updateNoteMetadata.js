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
        action: 'metamask.send',
        data: {
            contract: 'ZkAsset',
            at: assetAddress,
            method: 'updateNoteMetaData',
            data: [
                noteHash,
                metadata,
            ],
        },
    });

    return response;
}
