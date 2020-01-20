/* global artifacts */
const { proofs } = require('@aztec/dev-utils');

const ACE = artifacts.require('@aztec/protocol/contracts/ACE/ACE.sol');
const Swap = artifacts.require('@aztec/protocol/contracts/ACE/validators/swap/Swap.sol');
// const SwapInterface = artifacts.require('@aztec/protocol/contracts/interfaces/SwapInterface.sol');

// Swap.abi = SwapInterface.abi;

module.exports = (deployer) => {
    if (process.env.NODE_ENV === 'integration') {
        return deployer.deploy(Swap, {overwrite: false}).then(async ({ address: swapAddress }) => {
            const ace = await ACE.at(ACE.address);
    
            try {
                await ace.setProof(proofs.SWAP_PROOF, swapAddress);
            } catch (e) {}
        });
    }

    return deployer.deploy(Swap).then(async ({ address: swapAddress }) => {
        const ace = await ACE.at(ACE.address);

        try {
            await ace.setProof(proofs.SWAP_PROOF, swapAddress);
        } catch (e) {}
    });
};
