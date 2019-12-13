import React from 'react';
import PropTypes from 'prop-types';
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

        return {
            assetAddress,
            asset,
            transactions: parsedTransactions,
            publicOwner: currentAddress,
            sender: isGSNAvailable ? proxyContract : currentAddress,
            amount,
            numberOfOutputNotes,
            userAccessAccounts,
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
