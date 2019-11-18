import devUtils from '@aztec/dev-utils';
import {
    log,
} from '~utils/log';
import ZkAssetOwnable from '~contracts/ZkAssetOwnable';
import ZkAssetMintable from '~contracts/ZkAssetMintable';
import ZkAssetBurnable from '~contracts/ZkAssetBurnable';
import ERC20Mintable from '~contracts/ERC20Mintable';
import JoinSplit from '~contracts/JoinSplit';
import JoinSplitFluid from '~contracts/JoinSplitFluid';

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

const setProofInAce = async (proofName, web3Service) => {
    const category = proofCategoryMapping[proofName];
    const existingProof = await web3Service
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
        const proofContract = web3Service.registerContract(proofContractMapping[proofName]);

        await web3Service
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
    web3Service,
}) {
    log('Deploying ERC20Mintable...');
    const {
        address: erc20Address,
    } = await web3Service.deploy(ERC20Mintable);

    const aceAddress = web3Service.contract('ACE').address;

    await setProofInAce('JOIN_SPLIT_PROOF', web3Service);

    if (zkAssetType === 'ZkAssetMintable') {
        await setProofInAce('MINT_PROOF', web3Service);
    } else if (zkAssetType === 'ZkAssetOwnable') {
        await setProofInAce('BURN_PROOF', web3Service);
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
    } = await web3Service.deploy(contractMapping[zkAssetType], assetParams);

    log(`Setting proof in ${zkAssetType}...`);
    await web3Service
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
