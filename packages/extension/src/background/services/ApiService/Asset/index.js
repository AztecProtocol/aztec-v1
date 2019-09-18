import { handleQuery } from '../../../utils/connectionUtils';

export default async function asset(query) {
    const {
        data,
        domain,
    } = query;
    const {
        response,
    } = await handleQuery({
        query: `assetResponse: asset {
            asset {
                address
                linkedTokenAddress
                scalingFactor
                canAdjustSupply
                canConvert
            }
            error {
                type
                key
                message
                response
            }
        }
    `,
        data,
        domain,
    });

    return {
        ...query,
        response,
    };
}
