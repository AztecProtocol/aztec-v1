import ConnectionService from '~/ui/services/ConnectionService';
import Web3Service from '~/helpers/Web3Service';

export default async function permitERC20({
    asset,
    allowanceSpender,
}) {
    const {
        linkedTokenAddress,
    } = asset;

    let error;
    let nonce;
    try {
        nonce = await Web3Service
            .useContract('IERC20Permit')
            .at(linkedTokenAddress)
            .method('nonces')
            .call(
                allowanceSpender,
            );
    } catch (e) {
        console.log(e);
        error = e;
    }
    const expiry = Date.now() + 24 * 60 * 60;
    const {
        signature,
        error: errorSig,
    } = await ConnectionService.post({
        action: 'metamask.eip712.permit',
        data: {
            nonce,
            expiry,
            allowed: true,
            verifyingContract: linkedTokenAddress,
            spender: allowanceSpender,
        },
    });

    if (errorSig || error) {
        return {
            error: errorSig || error,
        };
    }

    return {
        spender: allowanceSpender,
        nonce,
        expiry,
        allowed: true,
        signature,
    };
}
