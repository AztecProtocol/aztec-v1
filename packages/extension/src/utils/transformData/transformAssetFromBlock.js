import isEmptyAddress from '~/utils/isEmptyAddress';

export default function transformAssetFromBlock({
    blockNumber,
    registryOwner,
    registryAddress,
    scalingFactor,
    linkedTokenAddress,
    canAdjustSupply,
    canConvert,
}) {
    return {
        blockNumber,
        registryOwner,
        registryAddress,
        scalingFactor,
        linkedTokenAddress: isEmptyAddress(linkedTokenAddress)
            ? ''
            : linkedTokenAddress,
        canAdjustSupply,
        canConvert,
    };
}
