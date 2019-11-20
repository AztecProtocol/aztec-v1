import React from 'react';
import PropTypes from 'prop-types';
import {
    emptyIntValue,
} from '~ui/config/settings';
import makeAsset from '~uiModules/utils/asset';
import AnimatedTransaction from '~ui/views/handlers/AnimatedTransaction';
import { withdrawSteps } from '~ui/config/steps';
import {
    gsnConfigShape,
} from '~ui/config/propTypes';


const Withdraw = ({
    initialStep,
    assetAddress,
    sender,
    transactions,
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
            sender,
            transactions,
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
    sender: PropTypes.string.isRequired,
    transactions: PropTypes.arrayOf(PropTypes.shape({
        amount: PropTypes.number.isRequired,
        to: PropTypes.string.isRequired,
    })).isRequired,
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
