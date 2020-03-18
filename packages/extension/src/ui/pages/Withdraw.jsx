import React from 'react';
import PropTypes from 'prop-types';
import {
    inputAmountType,
} from '~/ui/config/propTypes';
import {
    emptyIntValue,
} from '~/ui/config/settings';
import getGSNConfig from '~/ui/helpers/getGSNConfig';
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
    inputNoteHashes,
}) => {
    const fetchInitialData = async () => {
        const {
            address: currentAddress,
        } = currentAccount;
        const gsnConfig = await getGSNConfig();
        const {
            isGSNAvailable,
            proxyContract,
        } = gsnConfig;
        const steps = isGSNAvailable ? withdrawSteps.gsn : withdrawSteps.metamask;
        const sender = proxyContract;
        const asset = await makeAsset(assetAddress);

        return {
            steps,
            retryWithMetaMaskStep: withdrawSteps.metamask.slice(-1)[0],
            proofType: 'WITHDRAW_PROOF',
            assetAddress,
            asset,
            currentAddress,
            transactions: [
                {
                    amount: parseInputAmount(amount),
                    to,
                },
            ],
            amount: parseInputAmount(amount),
            publicOwner: to,
            spender: sender,
            sender,
            numberOfInputNotes,
            inputNoteHashes,
            isGSNAvailable,
        };
    };

    return (
        <StepsHandler
            testId="steps-withdraw"
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
    inputNoteHashes: PropTypes.arrayOf(PropTypes.string),
};

Withdraw.defaultProps = {
    numberOfInputNotes: emptyIntValue,
    inputNoteHashes: [],
};

export default Withdraw;
