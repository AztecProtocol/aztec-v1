import noteModel from '~database/models/note';
import addressModel from '~database/models/address';
import assetModel from '~database/models/asset';
import {
    isDestroyed,
} from '~utils/noteStatus';

export default async function init() {
    const assetNoteValues = {};
    const ownerKeyIdMapping = {};
    const assetKeyIdMapping = {};

    await noteModel.each(async ({
        key,
        asset,
        owner,
        value,
        status,
    }) => {
        if (value < 0
            || isDestroyed(status)
        ) {
            return;
        }

        let group = assetNoteValues;

        let ownerId = ownerKeyIdMapping[owner];
        if (!ownerId) {
            ({
                address: ownerId,
            } = await addressModel.get({
                key: owner,
            }));
            ownerKeyIdMapping[owner] = ownerId;
        }
        if (!group[ownerId]) {
            group[ownerId] = {};
        }
        group = group[ownerId];

        let assetId = assetKeyIdMapping[asset];
        if (!assetId) {
            ({
                address: assetId,
            } = await assetModel.get({
                key: asset,
            }));
            assetKeyIdMapping[asset] = assetId;
        }
        if (!group[assetId]) {
            group[assetId] = {
                balance: 0,
                noteValues: {},
            };
        }
        group[assetId].balance += value;
        group = group[assetId].noteValues;

        if (!group[value]) {
            group[value] = [];
        }
        group[value].push(key);
    });

    return assetNoteValues;
}
