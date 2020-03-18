import BN from 'bn.js';
import Web3Service from '~/helpers/Web3Service';
import {
    warnLogProduction,
} from '~/utils/log';
import {
    argsError,
} from '~/utils/error';
import {
    formatNumber,
} from '~/utils/format';
import getTokenInfo from '~/utils/getTokenInfo';
import Asset from '~/background/database/models/asset';
import validateAccounts from './utils/validateAccounts';

export default async function verifyDepositRequest({
    assetAddress,
    transactions,
    userAccess,
    returnProof,
    sender,
    publicOwner,
}) {
    if ((sender || publicOwner) && !returnProof) {
        const invalidArgs = [];
        if (sender) {
            invalidArgs.push('sender');
        }
        if (publicOwner) {
            invalidArgs.push('publicOwner');
        }
        warnLogProduction(argsError('input.returnProof.only', {
            args: invalidArgs.join(', '),
        }));
    }

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
        const {
            decimals,
        } = getTokenInfo(linkedTokenAddress) || {};
        const formattedBalance = formatNumber(balance, decimals || 0);
        const formattedERC20Amonut = formatNumber(erc20Amount, decimals || 0);

        return argsError('erc20.deposit.balance.notEnough', {
            balance: formattedBalance,
            erc20Amount: formattedERC20Amonut,
            notesValue,
        });
    }

    const addresses = transactions
        .filter(({ aztecAccountNotRequired }) => !aztecAccountNotRequired)
        .map(({ to }) => to);
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
