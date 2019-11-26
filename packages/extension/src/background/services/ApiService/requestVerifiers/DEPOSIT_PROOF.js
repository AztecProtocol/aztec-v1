import Web3Service from '~/helpers/Web3Service';
import {
    argsError,
} from '~/utils/error';
import Asset from '~/background/database/models/asset';
import validateExtensionAccount from '../utils/validateExtensionAccount';
import validateAccounts from '../utils/validateAccounts';

export default async function verifyDepositRequest({
    assetAddress,
    transactions,
    from,
}) {
    const { networkId } = Web3Service;
    const {
        linkedTokenAddress,
    } = await Asset.get(
        { networkId },
        { registryOwner: assetAddress },
    );

    const depositAmount = transactions
        .reduce((sum, { amount }) => sum + amount, 0);

    const aceAddress = Web3Service.getAddress('ACE');

    let allowance = await Web3Service
        .useContract('ERC20')
        .at(linkedTokenAddress)
        .method('allowance')
        .call(
            from,
            aceAddress,
        );
    allowance = parseInt(allowance, 10);

    if (depositAmount > allowance) {
        return argsError('erc20.deposit.allowance.notEnough', {
            allowance,
            depositAmount,
        });
    }

    let balance = await Web3Service
        .useContract('ERC20')
        .at(linkedTokenAddress)
        .method('balanceOf')
        .call(
            from,
        );
    balance = parseInt(balance, 10);

    if (balance < allowance) {
        return argsError('erc20.deposit.balance.notEnough', {
            balance,
            depositAmount,
        });
    }

    const ownerError = await validateExtensionAccount(from);
    if (ownerError) {
        return ownerError;
    }

    const addresses = transactions.map(({ to }) => to);
    const invalidAddressError = await validateAccounts({
        addresses,
    });
    if (invalidAddressError) {
        return invalidAddressError;
    }

    return null;
}
