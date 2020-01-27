import React from 'react';
import PropTypes from 'prop-types';
import {
    gsnConfigShape,
    inputTransactionShape,
} from '~/ui/config/propTypes';
import {
    emptyIntValue,
} from '~/ui/config/settings';
import apis from '~uiModules/apis';
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
    userAccess,
    gsnConfig,
}) => {
    const {
        address: currentAddress,
    } = currentAccount;
    const {
        isGSNAvailable,
        proxyContract,
    } = gsnConfig;
    const steps = isGSNAvailable ? sendSteps.gsn : sendSteps.metamask;
    const sender = isGSNAvailable ? proxyContract : currentAddress;

    const fetchInitialData = async () => {
        const asset = await makeAsset(assetAddress);
        const parsedTransactions = parseInputTransactions(transactions);
        const amount = parsedTransactions.reduce((sum, tx) => sum + tx.amount, 0);
        const userAccessAccounts = await apis.account.batchGetExtensionAccount(userAccess);

        return {
            assetAddress,
            currentAddress,
            asset,
            sender,
            transactions: parsedTransactions,
            numberOfInputNotes,
            numberOfOutputNotes,
            userAccessAccounts,
            amount,
        };
    };

    return (
        <StepsHandler
            steps={steps}
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
    userAccess: PropTypes.arrayOf(PropTypes.string),
    gsnConfig: gsnConfigShape.isRequired,
};

Send.defaultProps = {
    numberOfInputNotes: emptyIntValue,
    numberOfOutputNotes: emptyIntValue,
    userAccess: [],
};

export default Send;
