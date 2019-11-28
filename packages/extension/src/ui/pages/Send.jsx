import React from 'react';
import PropTypes from 'prop-types';
import {
    emptyIntValue,
} from '~ui/config/settings';
import makeAsset from '~ui/utils/makeAsset';
import AnimatedTransaction from '~ui/views/handlers/AnimatedTransaction';
import { sendSteps } from '~ui/config/steps';
import {
    gsnConfigShape,
} from '~ui/config/propTypes';


const Send = ({
    initialStep,
    assetAddress,
    sender,
    transactions,
    proof,
    numberOfInputNotes,
    numberOfOutputNotes,
    gsnConfig,
}) => {
    const {
        isGSNAvailable,
    } = gsnConfig;
    const steps = isGSNAvailable ? sendSteps.gsn : sendSteps.metamask;
    const fetchInitialData = async () => {
        const asset = await makeAsset(assetAddress);
        const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

        return {
            assetAddress,
            asset,
            sender,
            transactions,
            proof,
            numberOfInputNotes,
            numberOfOutputNotes,
            totalAmount,
            gsnConfig,
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

Send.propTypes = {
    initialStep: PropTypes.number,
    assetAddress: PropTypes.string.isRequired,
    sender: PropTypes.string.isRequired,
    transactions: PropTypes.arrayOf(PropTypes.shape({
        amount: PropTypes.number.isRequired,
        to: PropTypes.string.isRequired,
    })).isRequired,
    proof: PropTypes.shape({
        inputNotes: PropTypes.array.isRequired,
    }),
    numberOfInputNotes: PropTypes.number,
    numberOfOutputNotes: PropTypes.number,
    gsnConfig: gsnConfigShape.isRequired,
};

Send.defaultProps = {
    initialStep: 0,
    proof: null,
    numberOfInputNotes: emptyIntValue,
    numberOfOutputNotes: emptyIntValue,
};

export default Send;
