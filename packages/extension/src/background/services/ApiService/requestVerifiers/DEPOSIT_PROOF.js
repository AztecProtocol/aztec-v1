import BN from 'bn.js';
import Web3Service from '~/helpers/Web3Service';
import {
    argsError,
} from '~/utils/error';
import Asset from '~/background/database/models/asset';
import validateAccounts from '../utils/validateAccounts';

export default async function verifyDepositRequest({
    assetAddress,
    transactions,
    userAccess,
}) {
    const {
        networkId,
        account: {
            address: currentAddress,
        },
    } = Web3Service;
    const {
        linkedTokenAddress,
        scalingFactor: scalingFactorStr,
    } = await Asset.get(
        { networkId },
        { registryOwner: assetAddress },
    );

    const scalingFactor = new BN(scalingFactorStr);

    const notesValue = transactions
        .reduce((sum, { amount }) => sum + amount, 0);

    const erc20Amount = scalingFactor.mul(new BN(notesValue));

    let balance = await Web3Service
        .useContract('ERC20')
        .at(linkedTokenAddress)
        .method('balanceOf')
        .call(
            currentAddress,
        );
    balance = new BN(balance);

    if (balance.lt(erc20Amount)) {
        return argsError('erc20.deposit.balance.notEnough', {
            balance: balance.toString(),
            erc20Amount: erc20Amount.toString(),
            amount: notesValue,
        });
    }

    const addresses = transactions.map(({ to }) => to);
    if (userAccess && userAccess.length > 0) {
        userAccess.forEach((address) => {
            if (addresses.indexOf(address) < 0) {
                addresses.push(address);
            }
        });
    }
    const invalidAddressError = await validateAccounts(addresses);
    if (invalidAddressError) {
        return invalidAddressError;
    }

    return null;
}
