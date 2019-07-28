import devUtils from '@aztec/dev-utils';
import bn128 from '@aztec/bn128';
/* eslint-disable import/no-unresolved */
import ZkAssetOwnable from '../../../build/protocol/ZkAssetOwnable';
import ERC20Mintable from '../../../build/protocol/ERC20Mintable';
import JoinSplit from '../../../build/protocol/JoinSplit';
/* eslint-enable */
import Web3Service from '../services/Web3Service';

export default async function createNewAsset({
    epoch,
    category,
    proofId,
    filter,
    scalingFactor,
    canAdjustSupply,
    canConvert,
}) {
    await Web3Service
        .useContract('ACE')
        .method('setCommonReferenceString')
        .send(bn128.CRS);

    const existingProof = await Web3Service
        .useContract('ACE')
        .method('validators')
        .call(
            epoch,
            category,
            proofId,
        );

    if (!existingProof) {
        const { JOIN_SPLIT_PROOF } = devUtils.proofs;

        Web3Service.registerContract(JoinSplit);
        const joinSplitAddress = Web3Service.contract('JoinSplit').address;

        await Web3Service
            .useContract('ACE')
            .method('setProof')
            .send(
                JOIN_SPLIT_PROOF,
                joinSplitAddress,
            );
    }

    const {
        contractAddress: erc20Address,
    } = await Web3Service.deploy(ERC20Mintable);

    const aceAddress = Web3Service.contract('ACE').address;

    const {
        contractAddress: zkAssetAddress,
    } = await Web3Service.deploy(ZkAssetOwnable, [
        aceAddress,
        erc20Address,
        scalingFactor,
        canAdjustSupply,
        canConvert,
    ]);

    await Web3Service
        .useContract('ZkAsset')
        .at(zkAssetAddress)
        .method('setProofs')
        .send(
            epoch,
            filter,
        );

    return {
        erc20Address,
        zkAssetAddress: zkAssetAddress.toLowerCase(),
    };
}
