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
import returnAndClose from '~ui/helpers/returnAndClose';
import AnimatedTransaction from '~ui/views/handlers/AnimatedTransaction';

const handleOnStep = (step) => {
    const newProps = {};
    switch (step) {
        case 1:
            break;
        default:
    }

    return newProps;
};

const Deposit = ({
    initialStep,
    from,
    sender,
    assetAddress,
    transactions,
    numberOfOutputNotes,
    gsnConfig,
}) => {
    const {
        isGSNAvailable,
        proxyContract,
    } = gsnConfig;
    const steps = isGSNAvailable ? depositSteps.gsn : depositSteps.metamask;
    const actualSender = isGSNAvailable ? proxyContract : sender;

    const fetchInitialData = async () => {
        const asset = await makeAsset(assetAddress);
        const parsedTransactions = parseInputTransactions(transactions);
        const amount = parsedTransactions.reduce((sum, tx) => sum + tx.amount, 0);

        return {
            assetAddress,
            asset,
            from,
            owner: from,
            publicOwner: from,
            sender: actualSender,
            transactions: parsedTransactions,
            amount,
            numberOfOutputNotes,
        };
    };

    return (
        <AnimatedTransaction
            initialStep={initialStep}
            steps={steps}
            fetchInitialData={fetchInitialData}
            onExit={returnAndClose}
            onStep={handleOnStep}
        />
    );
};

Deposit.propTypes = {
    initialStep: PropTypes.number,
    from: PropTypes.string.isRequired,
    sender: PropTypes.string.isRequired,
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
