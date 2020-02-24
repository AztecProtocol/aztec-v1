import ConnectionService from '~/ui/services/ConnectionService';
import Web3Service from '~/helpers/Web3Service';

export default async function permitERC20({
    asset,
    requestedAllowance,
    allowanceSpender,
}) {


    const {
        linkedTokenAddress,
    } = asset;

    let error;
    try {
       const nonce =  await Web3Service
            .useContract('ERC20')
            .at(linkedTokenAddress)
            .method('nonces')
            .send(
                allowanceSpender,
            );
    } catch (e) {
        error = e;
    }
    const exipry = Date.now() + 24 * 60 * 60;
    const {
        signature,
        error,
    } = await ConnectionService.post({
        action: 'metamask.eip712.permit',
        data: {
            nonce,
            expiry,
            allowed: requestedAllowance
            spender: allowanceSpender,
        },
    });

    if (error) {
        return {
            error,
        };
    }

    return {
        spender: sender,
        nonce,
        expiry,
        allowed; requestedAllowance,
        signature,
    };
}
