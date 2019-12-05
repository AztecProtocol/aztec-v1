import React from 'react';
import PropTypes from 'prop-types';
import {
    gsnConfigShape,
    inputTransactionShape,
} from '~/ui/config/propTypes';
import {
    emptyIntValue,
} from '~ui/config/settings';
import makeAsset from '~ui/utils/makeAsset';
import parseInputTransactions from '~/ui/utils/parseInputTransactions';
import AnimatedTransaction from '~ui/views/handlers/AnimatedTransaction';
import { sendSteps } from '~ui/config/steps';

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
        const parsedTransactions = parseInputTransactions(transactions);
        const amount = parsedTransactions.reduce((sum, tx) => sum + tx.amount, 0);

        return {
            assetAddress,
            asset,
            sender,
            transactions: parsedTransactions,
            proof,
            numberOfInputNotes,
            numberOfOutputNotes,
            amount,
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
    transactions: PropTypes.arrayOf(inputTransactionShape).isRequired,
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
