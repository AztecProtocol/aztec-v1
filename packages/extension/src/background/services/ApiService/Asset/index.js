import { handleQuery } from '../../../utils/connectionUtils';

export default async function asset(query) {
    const {
        args: { id, currentAddress },
        domain,
    } = query;
    const {
        response,
    } = await handleQuery({
        query: `
        assetResponse: asset(id: "${id}", currentAddress: "${currentAddress}") {
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
        domain,
    });

    return {
        ...query,
        response,
    };
}
