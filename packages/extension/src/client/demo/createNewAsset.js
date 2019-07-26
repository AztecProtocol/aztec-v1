import devUtils from '@aztec/dev-utils';
import bn128 from '@aztec/bn128';
import Web3Service from '../services/Web3Service';
import ACE from '../contracts/ACE';
import ZkAssetOwnable from '../contracts/ZkAssetOwnable';
import ERC20Mintable from '../contracts/ERC20Mintable';
import JoinSplit from '../contracts/JoinSplit';

export default async function createNewAsset({
    initialBalance = 200,
    epoch = 1,
    category = 1,
    proofId = 1,
    filter = 17,
    scalingFactor = 1,
    canAdjustSupply = true,
    canConvert = true,
} = {}) {
    Web3Service.registerContract(ACE);
    Web3Service.registerInterface(ERC20Mintable);
    Web3Service.registerInterface(ZkAssetOwnable);

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
        address: userAddress,
    } = Web3Service.account;

    const {
        contractAddress: erc20Address,
    } = await Web3Service.deploy(ERC20Mintable);
    await Web3Service
        .useContract('ERC20Mintable')
        .at(erc20Address)
        .method('mint')
        .send(
            userAddress,
            initialBalance,
        );

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
        .useContract('ZkAssetOwnable')
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
