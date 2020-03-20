import React from 'react';
import PropTypes from 'prop-types';
import {
    inputAmountType,
} from '~/ui/config/propTypes';
import {
    emptyIntValue,
} from '~/ui/config/settings';
import parseInputAmount from '~/ui/utils/parseInputAmount';
import makeAsset from '~/ui/utils/makeAsset';
import getGSNConfig from '~/ui/helpers/getGSNConfig';
import StepsHandler from '~/ui/views/handlers/StepsHandler';
import CreateNoteFromBalanceContent from '~/ui/views/CreateNoteFromBalanceContent';
import createNoteFromBalanceSteps from '~/ui/steps/createNoteFromBalance';

const CreateNoteFromBalance = ({
    currentAccount,
    assetAddress,
    amount: inputAmount,
    numberOfInputNotes,
    numberOfOutputNotes,
    userAccess,
}) => {
    const {
        address: currentAddress,
    } = currentAccount;

    const fetchInitialData = async () => {
        const gsnConfig = await getGSNConfig();
        const {
            isGSNAvailable,
            proxyContract,
        } = gsnConfig;
        const steps = createNoteFromBalanceSteps[isGSNAvailable ? 'gsn' : 'metamask'];

        const asset = await makeAsset(assetAddress);
        const sender = proxyContract;
        const amount = parseInputAmount(inputAmount);
        const transactions = [
            {
                amount,
                to: currentAddress,
            },
        ];

        return {
            steps,
            retryWithMetaMaskStep: createNoteFromBalanceSteps.metamask.slice(-1)[0],
            proofType: 'TRANSFER_PROOF',
            assetAddress,
            currentAddress,
            asset,
            sender,
            amount,
            numberOfInputNotes,
            numberOfOutputNotes,
            userAccess,
            publicOwner: currentAddress,
            spender: sender,
            transactions,
            gsnConfig,
            isGSNAvailable,
        };
    };

    return (
        <StepsHandler
            testId="steps-create-note"
            fetchInitialData={fetchInitialData}
            Content={CreateNoteFromBalanceContent}
        />
    );
};

CreateNoteFromBalance.propTypes = {
    currentAccount: PropTypes.shape({
        address: PropTypes.string.isRequired,
    }).isRequired,
    assetAddress: PropTypes.string.isRequired,
    amount: inputAmountType.isRequired,
    numberOfInputNotes: PropTypes.number,
    numberOfOutputNotes: PropTypes.number,
    userAccess: PropTypes.arrayOf(PropTypes.string),
};

CreateNoteFromBalance.defaultProps = {
    numberOfInputNotes: emptyIntValue,
    numberOfOutputNotes: emptyIntValue,
    userAccess: [],
};

export default CreateNoteFromBalance;
