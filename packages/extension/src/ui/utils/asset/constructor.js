import {
    getLinkedTokenAddress,
} from '~ui/apis/assets';
import {
    icon,
} from '~ui/utils/token';
import getCodeByAddress from './getCodeByAddress';

export default async function assetConstructor(address) {
    const tokenAddress = await getLinkedTokenAddress(address);
    const code = getCodeByAddress(address);

    return {
        code,
        tokenAddress,
        address,
        icon: icon(code),
    };
}
