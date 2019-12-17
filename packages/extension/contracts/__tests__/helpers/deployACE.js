import bn128 from '@aztec/bn128';
import { proofs } from '@aztec/dev-utils';
import {
    contract,
} from '@openzeppelin/test-environment';

const ACE = contract.fromArtifact('ACE');
const JoinSplit = contract.fromArtifact('JoinSplit');
const JoinSplitFluid = contract.fromArtifact('JoinSplitFluid');
const BaseFactory = contract.fromArtifact('FactoryBase201907');
const AdjustableFactory = contract.fromArtifact('FactoryAdjustable201907');

const generateFactoryId = version => [...version]
    .reverse()
    .reduce((accum, val, i) => accum + (val * (256 ** i)), 0);

export default async function deployACE({
    proofs: requiredProofs = [
        'JoinSplit',
        'JoinSplitFluid',
    ],
    from,
} = {}) {
    const ace = await ACE.new({ from });
    await ace.setCommonReferenceString(bn128.CRS, { from });

    if (requiredProofs.includes('JoinSplit')) {
        const joinSplit = await JoinSplit.new({ from });
        await ace.setProof(proofs.JOIN_SPLIT_PROOF, joinSplit.address, { from });
    }

    if (requiredProofs.includes('JoinSplitFluid')) {
        const joinSplitFluid = await JoinSplitFluid.new({ from });
        await ace.setProof(proofs.MINT_PROOF, joinSplitFluid.address, { from });
        await ace.setProof(proofs.BURN_PROOF, joinSplitFluid.address, { from });
    }

    const baseFactory = await BaseFactory.new(ace.address, { from });
    await ace.setFactory(
        generateFactoryId([1, 1, 1]),
        baseFactory.address,
        { from },
    );

    const adjustableFactory = await AdjustableFactory.new(ace.address, { from });
    await ace.setFactory(
        generateFactoryId([1, 1, 2]),
        adjustableFactory.address,
        { from },
    );

    return ace;
}
