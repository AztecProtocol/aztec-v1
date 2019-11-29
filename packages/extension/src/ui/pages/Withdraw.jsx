import React from 'react';
import PropTypes from 'prop-types';
import {
    emptyIntValue,
} from '~ui/config/settings';
import makeAsset from '~/ui/utils/makeAsset';
import AnimatedTransaction from '~ui/views/handlers/AnimatedTransaction';
import { withdrawSteps } from '~ui/config/steps';
import {
    gsnConfigShape,
} from '~ui/config/propTypes';

const Withdraw = ({
    initialStep,
    assetAddress,
    amount,
    sender,
    to,
    proof,
    numberOfInputNotes,
    gsnConfig,
}) => {
    const {
        isGSNAvailable,
    } = gsnConfig;
    const steps = isGSNAvailable ? withdrawSteps.gsn : withdrawSteps.metamask;

    const fetchInitialData = async () => {
        const asset = await makeAsset(assetAddress);

        return {
            assetAddress,
            asset,
            amount,
            sender,
            to,
            proof,
            numberOfInputNotes,
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

Withdraw.propTypes = {
    initialStep: PropTypes.number,
    assetAddress: PropTypes.string.isRequired,
    amount: PropTypes.number.isRequired,
    sender: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired,
    proof: PropTypes.shape({
        inputNotes: PropTypes.array.isRequired,
    }),
    numberOfInputNotes: PropTypes.number,
    gsnConfig: gsnConfigShape.isRequired,
};

Withdraw.defaultProps = {
    initialStep: 0,
    proof: null,
    numberOfInputNotes: emptyIntValue,
};

export default Withdraw;
