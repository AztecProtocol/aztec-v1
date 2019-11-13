import React from 'react';
import PropTypes from 'prop-types';
import {
    proofs,
} from '@aztec/dev-utils';
import {
    emptyIntValue,
} from '~ui/config/settings';
import makeAsset from '~uiModules/utils/asset';
import returnAndClose from '~ui/helpers/returnAndClose';
import SendConfirm from '~ui/views/SendConfirm';
import AnimatedTransaction from '~ui/views/handlers/AnimatedTransaction';
import SendSign from '~ui/views/WithdrawSign';
import TransactionSend from '~ui/views/TransactionSend';
import apis from '~uiModules/apis';

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
        content: SendSign,
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

const handleOnStep = (step) => {
    const newProps = {};
    switch (step) {
        case 1:
            newProps.autoStart = true;
            break;
        default:
    }

    return newProps;
};

const Send = ({
    assetAddress,
    sender,
    transactions,
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
            numberOfInputNotes,
            numberOfOutputNotes,
            totalAmount,
            amount: totalAmount,
            proofId: proofs.JOIN_SPLIT_PROOF,
        };
    };
    return (
        <AnimatedTransaction
            steps={steps}
            fetchInitialData={fetchInitialData}
            onExit={returnAndClose}
            onStep={handleOnStep}
        />
    );
};

Send.propTypes = {
    assetAddress: PropTypes.string.isRequired,
    sender: PropTypes.string.isRequired,
    transactions: PropTypes.arrayOf(PropTypes.shape({
        amount: PropTypes.number.isRequired,
        to: PropTypes.string.isRequired,
    })).isRequired,
    numberOfInputNotes: PropTypes.number,
    numberOfOutputNotes: PropTypes.number,
};

Send.defaultProps = {
    numberOfInputNotes: emptyIntValue,
    numberOfOutputNotes: emptyIntValue,
};

export default Send;
