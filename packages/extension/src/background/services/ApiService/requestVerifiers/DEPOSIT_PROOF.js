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

    // TODO - shoule be big number
    const scalingFactor = parseInt(scalingFactorStr, 10);

    const notesValue = transactions
        .reduce((sum, { amount }) => sum + amount, 0);

    const depositAmount = notesValue * scalingFactor;

    let balance = await Web3Service
        .useContract('ERC20')
        .at(linkedTokenAddress)
        .method('balanceOf')
        .call(
            currentAddress,
        );
    balance = parseInt(balance, 10);

    if (balance < depositAmount) {
        return argsError('erc20.deposit.balance.notEnough', {
            balance,
            depositAmount,
            notesValue,
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
