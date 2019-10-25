import {
    getLinkedTokenAddress,
} from '~ui/apis/asset';
import {
    icon,
} from '~ui/utils/token';
import getCodeByAddress from './getCodeByAddress';

export default async function assetConstructor(address) {
    const linkedTokenAddress = await getLinkedTokenAddress(address);
    const code = getCodeByAddress(address);

    return {
        code,
        linkedTokenAddress,
        address,
        icon: icon(code),
    };
}
