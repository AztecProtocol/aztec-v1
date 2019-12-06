import React from 'react';
import PropTypes from 'prop-types';
import {
    emptyIntValue,
} from '~/ui/config/settings';
import {
    inputTransactionShape,
    gsnConfigShape,
} from '~ui/config/propTypes';
import { depositSteps } from '~ui/config/steps';
import makeAsset from '~/ui/utils/makeAsset';
import parseInputTransactions from '~/ui/utils/parseInputTransactions';
import AnimatedTransaction from '~ui/views/handlers/AnimatedTransaction';

const Deposit = ({
    initialStep,
    currentAccount,
    assetAddress,
    transactions,
    numberOfOutputNotes,
    gsnConfig,
}) => {
    const {
        isGSNAvailable,
        proxyContract,
    } = gsnConfig;
    const {
        address: currentAddress,
    } = currentAccount;
    const steps = isGSNAvailable ? depositSteps.gsn : depositSteps.metamask;

    const fetchInitialData = async () => {
        const asset = await makeAsset(assetAddress);
        const parsedTransactions = parseInputTransactions(transactions);
        const amount = parsedTransactions.reduce((sum, tx) => sum + tx.amount, 0);

        return {
            assetAddress,
            asset,
            transactions: parsedTransactions,
            publicOwner: currentAddress,
            sender: isGSNAvailable ? proxyContract : currentAddress,
            amount,
            numberOfOutputNotes,
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
    gsnConfig: gsnConfigShape.isRequired,
};

Deposit.defaultProps = {
    initialStep: 0,
    numberOfOutputNotes: emptyIntValue,
};

export default Deposit;
