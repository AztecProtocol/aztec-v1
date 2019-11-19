import React from 'react';
import PropTypes from 'prop-types';
import {
    emptyIntValue,
} from '~ui/config/settings';
import makeAsset from '~uiModules/utils/asset';
import apis from '~uiModules/apis';
import WithdrawConfirm from '~ui/views/WithdrawConfirm';
import SignNotes from '~ui/views/SignNotes';
import TransactionSend from '~ui/views/TransactionSend';
import AnimatedTransaction from '~ui/views/handlers/AnimatedTransaction';
import {
    gsnConfigShape,
} from '~ui/config/propTypes';

const metamaskSteps = [
    {
        titleKey: 'withdraw.confirm.title',
        submitTextKey: 'withdraw.confirm.submit',
        content: WithdrawConfirm,
        tasks: [
            {
                name: 'proof',
                run: apis.proof.withdraw,
            },
        ],
    },
    {
        titleKey: 'withdraw.notes.title',
        submitTextKey: 'withdraw.notes.submit',
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
        titleKey: 'withdraw.send.title',
        submitTextKey: 'withdraw.send.submit',
        content: TransactionSend,
        contentProps: {
            descriptionKey: 'withdraw.send.explain',
        },
        tasks: [
            {
                name: 'send',
                run: apis.asset.confidentialTransfer,
            },
        ],
    },
];

const gsnSteps = [
    {
        titleKey: 'withdraw.confirm.title',
        submitText: 'withdraw.confirm.submitText',
        cancelText: 'withdraw.confirm.cancelText',
        content: WithdrawConfirm,
        tasks: [
            {
                name: 'proof',
                run: apis.proof.withdraw,
            },
        ],
    },
    {
        titleKey: 'withdraw.notes.title',
        submitText: 'withdraw.notes.submitText',
        cancelText: 'withdraw.notes.cancelText',
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
        titleKey: 'withdraw.send.title',
        submitText: 'withdraw.send.submitText',
        cancelText: 'withdraw.send.cancelText',
        content: TransactionSend,
        tasks: [
            {
                name: 'send',
                run: apis.asset.confidentialTransferFrom,
            },
        ],
    },
];

const Withdraw = ({
    initialStep,
    assetAddress,
    sender,
    transactions,
    proof,
    numberOfInputNotes,
}) => {
    const {
        isGSNAvailable,
    } = gsnConfig;
    const steps = isGSNAvailable ? gsnSteps : metamaskSteps;

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
