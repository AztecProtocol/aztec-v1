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
import StepsHandler from '~/ui/views/handlers/StepsHandler';
import WithdrawContent from '~/ui/views/WithdrawContent';
import withdrawSteps from '~/ui/steps/withdraw';

const Withdraw = ({
    currentAccount,
    assetAddress,
    amount,
    to,
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
            numberOfInputNotes,
        };
    };

    return (
        <StepsHandler
            steps={steps}
            fetchInitialData={fetchInitialData}
            Content={WithdrawContent}
        />
    );
};

Withdraw.propTypes = {
    currentAccount: PropTypes.shape({
        address: PropTypes.string.isRequired,
    }).isRequired,
    assetAddress: PropTypes.string.isRequired,
    amount: inputAmountType.isRequired,
    to: PropTypes.string.isRequired,
    numberOfInputNotes: PropTypes.number,
    gsnConfig: gsnConfigShape.isRequired,
};

Withdraw.defaultProps = {
    numberOfInputNotes: emptyIntValue,
};

export default Withdraw;
