import React from 'react';
import PropTypes from 'prop-types';
import {
    inputTransactionShape,
} from '~/ui/config/propTypes';
import {
    emptyIntValue,
} from '~/ui/config/settings';
import getGSNConfig from '~/ui/helpers/getGSNConfig';
import makeAsset from '~/ui/utils/makeAsset';
import parseInputTransactions from '~/ui/utils/parseInputTransactions';
import StepsHandler from '~/ui/views/handlers/StepsHandler';
import SendContent from '~/ui/views/SendContent';
import sendSteps from '~/ui/steps/send';

const Send = ({
    currentAccount,
    assetAddress,
    transactions,
    numberOfInputNotes,
    numberOfOutputNotes,
    noteHashes,
    userAccess,
}) => {
    const fetchInitialData = async () => {
        const gsnConfig = await getGSNConfig();
        const {
            isGSNAvailable,
            proxyContract,
        } = gsnConfig;
        const {
            address: currentAddress,
        } = currentAccount;
        const steps = isGSNAvailable ? sendSteps.gsn : sendSteps.metamask;
        const sender = proxyContract;

        const asset = await makeAsset(assetAddress);
        const parsedTransactions = parseInputTransactions(transactions);
        const amount = parsedTransactions.reduce((sum, tx) => sum + tx.amount, 0);

        return {
            steps,
            retryWithMetaMaskStep: sendSteps.metamask.slice(-1)[0],
            proofType: 'TRANSFER_PROOF',
            assetAddress,
            currentAddress,
            asset,
            sender,
            spender: sender,
            publicOwner: currentAddress,
            transactions: parsedTransactions,
            numberOfInputNotes,
            numberOfOutputNotes,
            noteHashes,
            userAccess,
            amount,
            isGSNAvailable,
        };
    };

    return (
        <StepsHandler
            testId="steps-send"
            fetchInitialData={fetchInitialData}
            Content={SendContent}
        />
    );
};

Send.propTypes = {
    currentAccount: PropTypes.shape({
        address: PropTypes.string.isRequired,
    }).isRequired,
    assetAddress: PropTypes.string.isRequired,
    transactions: PropTypes.arrayOf(inputTransactionShape).isRequired,
    numberOfInputNotes: PropTypes.number,
    numberOfOutputNotes: PropTypes.number,
    noteHashes: PropTypes.arrayOf(PropTypes.string),
    userAccess: PropTypes.arrayOf(PropTypes.string),
};

Send.defaultProps = {
    numberOfInputNotes: emptyIntValue,
    numberOfOutputNotes: emptyIntValue,
    noteHashes: [],
    userAccess: [],
};

export default Send;
