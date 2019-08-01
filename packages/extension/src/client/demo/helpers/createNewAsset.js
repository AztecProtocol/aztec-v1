import devUtils from '@aztec/dev-utils';
import Web3Service from '~client/services/Web3Service';
/* eslint-disable import/no-unresolved */
import ZkAssetOwnable from '../../../../build/protocol/ZkAssetOwnable';
import ZkAssetMintable from '../../../../build/protocol/ZkAssetMintable';
import ERC20Mintable from '../../../../build/protocol/ERC20Mintable';
import JoinSplit from '../../../../build/protocol/JoinSplit';
import JoinSplitFluid from '../../../../build/protocol/JoinSplitFluid';
/* eslint-enable */

const {
    JOIN_SPLIT_PROOF,
    MINT_PROOF,
} = devUtils.proofs;

const setJoinSplitProofInAce = async () => {
    const existingProof = await Web3Service
        .useContract('ACE')
        .method('validators')
        .call(
            1,
            1,
            1,
        );

    if (!existingProof) {
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
};

const setMintProofInAce = async () => {
    const existingProof = await Web3Service
        .useContract('ACE')
        .method('validators')
        .call(
            1,
            2,
            1,
        );

    if (!existingProof) {
        Web3Service.registerContract(JoinSplitFluid);
        const joinSplitFluidAddress = Web3Service.contract('JoinSplitFluid').address;

        await Web3Service
            .useContract('ACE')
            .method('setProof')
            .send(
                MINT_PROOF,
                joinSplitFluidAddress,
            );
    }
};

export default async function createNewAsset({
    zkAssetType = 'ZkAssetOwnable',
    scalingFactor,
}) {
    await setJoinSplitProofInAce();

    const {
        contractAddress: erc20Address,
    } = await Web3Service.deploy(ERC20Mintable);

    const aceAddress = Web3Service.contract('ACE').address;

    let zkAssetAddress;
    if (zkAssetType === 'ZkAssetMintable') {
        await setMintProofInAce();

        ({
            contractAddress: zkAssetAddress,
        } = await Web3Service.deploy(ZkAssetMintable, [
            aceAddress,
            erc20Address,
            scalingFactor,
        ]));
    } else {
        ({
            contractAddress: zkAssetAddress,
        } = await Web3Service.deploy(ZkAssetOwnable, [
            aceAddress,
            erc20Address,
            scalingFactor,
        ]));
    }

    await Web3Service
        .useContract('ZkAssetOwnable')
        .at(zkAssetAddress)
        .method('setProofs')
        .send(
            1,
            17,
        );

    return {
        erc20Address,
        zkAssetAddress: zkAssetAddress.toLowerCase(),
    };
}
