import React from 'react';
import PropTypes from 'prop-types';
import BN from 'bn.js';
import Web3Service from '~/helpers/Web3Service';
import {
    emptyIntValue,
} from '~/ui/config/settings';
import {
    inputTransactionShape,
    gsnConfigShape,
} from '~ui/config/propTypes';
import depositSteps from '~/ui/steps/deposit';
import apis from '~uiModules/apis';
import makeAsset from '~/ui/utils/makeAsset';
import parseInputTransactions from '~/ui/utils/parseInputTransactions';
import AnimatedTransaction from '~ui/views/handlers/AnimatedTransaction';

const Deposit = ({
    initialStep,
    currentAccount,
    assetAddress,
    transactions,
    numberOfOutputNotes,
    userAccess,
    gsnConfig,
}) => {
    const {
        isGSNAvailable,
        proxyContract,
    } = gsnConfig;
    const {
        address: currentAddress,
    } = currentAccount;
    const steps = depositSteps[isGSNAvailable ? 'gsn' : 'metamask'];

    const fetchInitialData = async () => {
        const asset = await makeAsset(assetAddress);
        const parsedTransactions = parseInputTransactions(transactions);
        const amount = parsedTransactions.reduce((sum, tx) => sum + tx.amount, 0);
        const userAccessAccounts = await apis.account.batchGetExtensionAccount(userAccess);
        const allowanceSpender = Web3Service.getAddress(isGSNAvailable ? 'ACE' : 'AZTECAccountRegistry');
        const allowance = await Web3Service
            .useContract('ERC20')
            .at(asset.linkedTokenAddress)
            .method('allowance')
            .call(
                currentAddress,
                allowanceSpender,
            );
        const approvedERC20Allowance = new BN(allowance);
        const requestedAllowance = asset.scalingFactor.mul(new BN(amount));
        let newSteps;
        if (approvedERC20Allowance.gte(requestedAllowance)) {
            newSteps = steps.filter(({ name }) => name !== 'approveERC20');
        }

        return {
            steps: newSteps,
            assetAddress,
            asset,
            transactions: parsedTransactions,
            publicOwner: isGSNAvailable ? currentAddress : allowanceSpender,
            sender: isGSNAvailable ? proxyContract : allowanceSpender,
            amount,
            numberOfOutputNotes,
            userAccessAccounts,
            requestedAllowance,
            allowanceSpender,
            spenderName: 'AZTEC',
        };
    };

    return (
        <AnimatedTransaction
            initialStep={initialStep}
            steps={steps}
            fetchInitialData={fetchInitialData}
        />
    );
};

Deposit.propTypes = {
    initialStep: PropTypes.number,
    currentAccount: PropTypes.shape({
        address: PropTypes.string.isRequired,
    }).isRequired,
    assetAddress: PropTypes.string.isRequired,
    transactions: PropTypes.arrayOf(inputTransactionShape).isRequired,
    numberOfOutputNotes: PropTypes.number,
    userAccess: PropTypes.arrayOf(PropTypes.string),
    gsnConfig: gsnConfigShape.isRequired,
};

Deposit.defaultProps = {
    initialStep: 0,
    numberOfOutputNotes: emptyIntValue,
    userAccess: [],
};

export default Deposit;
