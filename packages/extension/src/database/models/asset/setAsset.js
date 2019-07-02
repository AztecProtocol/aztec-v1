import mergeActions from '~database/utils/mergeActions';
import errorAction from '~database/utils/errorAction';
import setAssetIdKeyMapping from './setAssetIdKeyMapping';
import setAssetData from './setAssetData';

export default async function setAsset(
    asset,
    {
        forceUpdate = false,
        ignoreDuplicate = false,
    } = {},
) {
    const {
        id,
        ...data
    } = asset;
    if (!id) {
        return errorAction("'id' must be presented in asset object");
    }

    const res1 = await setAssetIdKeyMapping(
        id,
        {
            ignoreDuplicate: true,
        },
    );

    const {
        data: {
            [id]: key,
        },
    } = res1;
    const res2 = await setAssetData(
        {
            ...data,
            key,
        },
        {
            forceUpdate,
            ignoreDuplicate,
        },
    );

    return mergeActions(
        res1,
        res2,
    );
}
