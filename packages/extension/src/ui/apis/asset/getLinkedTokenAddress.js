import apollo from '~ui/apis/helpers/apollo';
import {
    getCurrentUser,
} from '~ui/apis/auth';

export default async function getLinkedTokenAddress(assetAddress) {
    const currentAddress = await getCurrentUser();
    const {
        asset,
    } = await apollo.query(`
        asset(id: "${assetAddress}", currentAddress: "${currentAddress}") {
            linkedTokenAddress
        }
    `) || {};

    return asset && asset.linkedTokenAddress;
}
