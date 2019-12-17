import React from 'react';
import PropTypes from 'prop-types';
import {
    gsnConfigShape,
    inputAmountType,
} from '~/ui/config/propTypes';
import {
    emptyIntValue,
} from '~/ui/config/settings';
import parseInputAmount from '~/ui/utils/parseInputAmount';
import makeAsset from '~/ui/utils/makeAsset';
import AnimatedTransaction from '~/ui/views/handlers/AnimatedTransaction';
import { withdrawSteps } from '~/ui/config/steps';

const Withdraw = ({
    initialStep,
    currentAccount,
    assetAddress,
    amount,
    to,
    proof,
    numberOfInputNotes,
    gsnConfig,
}) => {
    const {
        address: currentAddress,
    } = currentAccount;
    const {
        isGSNAvailable,
        proxyContract,
    } = gsnConfig;
    const steps = isGSNAvailable ? withdrawSteps.gsn : withdrawSteps.metamask;
    const sender = isGSNAvailable ? proxyContract : currentAddress;

    const fetchInitialData = async () => {
        const asset = await makeAsset(assetAddress);

        return {
            assetAddress,
            asset,
            currentAddress,
            amount: parseInputAmount(amount),
            publicOwner: to,
            sender,
            proof,
            numberOfInputNotes,
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
    currentAccount: PropTypes.shape({
        address: PropTypes.string.isRequired,
    }).isRequired,
    assetAddress: PropTypes.string.isRequired,
    amount: inputAmountType.isRequired,
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
