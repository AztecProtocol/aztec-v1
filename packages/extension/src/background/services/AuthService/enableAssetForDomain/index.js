import domainModel from '~database/models/domain';

export default async function enableAssetForDomain({
    domain,
    asset: assetAddress,
}) {
    const {
        data,
        modified,
    } = await domainModel.set(
        {
            domain,
            assets: {
                [assetAddress]: true,
            },
        },
        {
            ignoreDuplicate: true,
        },
    );

    if (!modified.length) {
        const {
            domain: {
                [domain]: {
                    assets: prevAssets,
                },
            },
        } = data;

        if (!prevAssets[assetAddress]) {
            await domainModel.update({
                domain,
                assets: {
                    ...prevAssets,
                    [assetAddress]: true,
                },
            });
        }
    }
}
