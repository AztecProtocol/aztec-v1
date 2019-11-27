import React from 'react';
import PropTypes from 'prop-types';
import {
    emptyIntValue,
} from '~/ui/config/settings';
import makeAsset from '~/ui/utils/makeAsset';
import returnAndClose from '~ui/helpers/returnAndClose';
import AnimatedTransaction from '~ui/views/handlers/AnimatedTransaction';
import { depositSteps } from '~ui/config/steps';
import {
    gsnConfigShape,
} from '~ui/config/propTypes';

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
        const amount = transactions.reduce((sum, t) => sum + t.amount, 0);

        return {
            asset,
            from,
            sender: actualSender,
            amount,
            transactions,
            numberOfOutputNotes,
        };
    };

    return (
        <AnimatedTransaction
            initialStep={initialStep}
            steps={steps}
            fetchInitialData={fetchInitialData}
            initialData={
                {
                    assetAddress,
                    owner: from,
                    publicOwner: from,
                    transactions,
                    sender: actualSender,
                    numberOfOutputNotes,
                }
            }
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
    transactions: PropTypes.arrayOf(PropTypes.shape({
        amount: PropTypes.number.isRequired,
        to: PropTypes.string.isRequired,
    })).isRequired,
    numberOfOutputNotes: PropTypes.number,
    gsnConfig: gsnConfigShape.isRequired,
};

Deposit.defaultProps = {
    initialStep: 0,
    numberOfOutputNotes: emptyIntValue,
};

export default Deposit;
