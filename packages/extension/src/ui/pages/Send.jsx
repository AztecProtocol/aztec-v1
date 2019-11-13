import React from 'react';
import PropTypes from 'prop-types';
import {
    emptyIntValue,
} from '~ui/config/settings';
import makeAsset from '~uiModules/utils/asset';
import apis from '~uiModules/apis';
import AnimatedTransaction from '~ui/views/handlers/AnimatedTransaction';
import SendConfirm from '~ui/views/SendConfirm';
import SignNotes from '~ui/views/SignNotes';
import TransactionSend from '~ui/views/TransactionSend';

const steps = [
    {
        titleKey: 'send.confirm.title',
        submitTextKey: 'send.confirm.submit',
        content: SendConfirm,
        tasks: [
            {
                name: 'proof',
                run: apis.proof.transfer,
            },
        ],
    },
    {
        titleKey: 'send.notes.title',
        submitTextKey: 'send.notes.submit',
        content: SignNotes,
        tasks: [
            {
                type: 'sign',
                name: 'approve',
                run: apis.note.signNotes,
            },
        ],
    },
    {
        titleKey: 'send.send.title',
        submitTextKey: 'send.send.submit',
        content: TransactionSend,
        contentProps: {
            descriptionKey: 'send.send.explain',
        },
        tasks: [
            {
                name: 'send',
                run: apis.asset.confidentialTransfer,
            },
        ],
    },
];

const Send = ({
    initialStep,
    assetAddress,
    sender,
    transactions,
    proof,
    numberOfInputNotes,
    numberOfOutputNotes,
}) => {
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
};

Send.defaultProps = {
    initialStep: 0,
    proof: null,
    numberOfInputNotes: emptyIntValue,
    numberOfOutputNotes: emptyIntValue,
};

export default Send;
