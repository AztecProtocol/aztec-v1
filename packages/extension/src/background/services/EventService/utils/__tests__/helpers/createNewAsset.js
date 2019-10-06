import devUtils from '@aztec/dev-utils';
import {
    log,
} from '~utils/log';
import Web3Service from '~client/services/Web3Service';
import ZkAssetOwnable from '../../../../build/protocol/ZkAssetOwnable';
import ZkAssetMintable from '../../../../build/protocol/ZkAssetMintable';
import ZkAssetBurnable from '../../../../build/protocol/ZkAssetBurnable';
import ERC20Mintable from '../../../../build/protocol/ERC20Mintable';
import JoinSplit from '../../../../build/protocol/JoinSplit';
import JoinSplitFluid from '../../../../build/protocol/JoinSplitFluid';

const contractMapping = {
    ZkAssetOwnable,
    ZkAssetMintable,
    ZkAssetBurnable,
};

const proofEpoch = 1;
const proofId = 1;
const proofCategoryMapping = {
    JOIN_SPLIT_PROOF: 1,
    MINT_PROOF: 2,
    BURN_PROOF: 3,
};

const proofContractMapping = {
    JOIN_SPLIT_PROOF: JoinSplit,
    MINT_PROOF: JoinSplitFluid,
    BURN_PROOF: JoinSplitFluid,
};

const setProofInAce = async (proofName) => {
    const category = proofCategoryMapping[proofName];
    const existingProof = await Web3Service
        .useContract('ACE')
        .method('validators')
        .call(
            proofEpoch,
            category,
            proofId,
        );

    if (!existingProof) {
        log(`Setting ${proofName} in ACE...'`);
        const proof = devUtils.proofs[proofName];
        const proofContract = Web3Service.registerContract(proofContractMapping[proofName]);

        await Web3Service
            .useContract('ACE')
            .method('setProof')
            .send(
                proof,
                proofContract.address,
            );
    }
};

export default async function createNewAsset({
    zkAssetType = 'ZkAssetOwnable',
    scalingFactor,
}) {
    log('Deploying ERC20Mintable...');
    const {
        address: erc20Address,
    } = await Web3Service.deploy(ERC20Mintable);

    const aceAddress = Web3Service.contract('ACE').address;

    await setProofInAce('JOIN_SPLIT_PROOF');

    if (zkAssetType === 'ZkAssetMintable') {
        await setProofInAce('MINT_PROOF');
    } else if (zkAssetType === 'ZkAssetOwnable') {
        await setProofInAce('BURN_PROOF');
    }

    log(`Deploying ${zkAssetType}...`);
    const assetParams = [
        aceAddress,
        erc20Address,
        scalingFactor,
    ];
    if (zkAssetType === 'ZkAssetMintable') {
        assetParams.push(0, '0x');
    }
    const {
        address: zkAssetAddress,
    } = await Web3Service.deploy(contractMapping[zkAssetType], assetParams);

    log(`Setting proof in ${zkAssetType}...`);
    await Web3Service
        .useContract(zkAssetType)
        .at(zkAssetAddress)
        .method('setProofs')
        .send(
            1,
            17,
        );

    return {
        erc20Address,
        zkAssetAddress,
    };
}
