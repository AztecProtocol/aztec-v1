import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    Text,
} from '@aztec/guacamole-ui';
import {
    formatValue,
} from '~ui/utils/asset';
import formatAddress from '~ui/utils/formatAddress';
import i18n from '~ui/helpers/i18n';
import apis from '~uiModules/apis';
import Transaction from '~ui/views/handlers/Transaction';
import Connection from '~ui/components/Connection';

const steps = [
    {
        titleKey: 'transaction.step.create.proof',
        tasks: [
            {
                name: 'proof',
                run: apis.proof.transfer,
            },
        ],
    },
    {
        titleKey: 'transaction.step.approve',
        tasks: [
            {
                name: 'approve',
                type: 'sign',
                run: apis.note.signNotes,
            },
        ],
    },
    {
        titleKey: 'transaction.step.send',
        tasks: [
            {
                name: 'send',
                run: apis.asset.confidentialTransfer,
            },
        ],
    },
    {
        titleKey: 'transaction.step.confirmed',
    },
];

const SendTransaction = ({
    asset,
    sender,
    transactions,
    amount: totalAmount,
    initialStep,
    initialTask,
    autoStart,
    goNext,
    goBack,
    onClose,
}) => {
    const {
        code,
        address: assetAddress,
    } = asset;

    const [firstTransaction, ...rest] = transactions;
    const moreItems = rest.map(({
        amount,
        to,
    }) => `${formatAddress(to, 6, 4)} (+${formatValue(code, amount)})`);

    const initialData = {
        assetAddress: asset.address,
        sender,
        transactions,
    };

    const ticketHeader = (
        <div>
            <Block bottom="s">
                <Text
                    text={formatValue(code, totalAmount)}
                    size="m"
                    color="primary"
                    weight="semibold"
                />
            </Block>
            <Connection
                theme="white"
                from={{
                    type: 'asset',
                    src: asset.icon,
                    alt: code,
                    description: formatAddress(assetAddress, 6, 4),
                }}
                to={{
                    type: 'user',
                    description: formatAddress(firstTransaction.to, 6, 4),
                    moreItems,
                }}
                size="s"
                actionIconName="send"
            />
        </div>
    );

    return (
        <Transaction
            title={i18n.t('send.transaction')}
            description={i18n.t('send.transaction.description')}
            content={ticketHeader}
            ticketHeight={3}
            steps={steps}
            initialStep={initialStep}
            initialTask={initialTask}
            initialData={initialData}
            submitButtonText={i18n.t('proof.create')}
            successMessage={i18n.t('transaction.success')}
            autoStart={autoStart}
            goNext={goNext}
            goBack={goBack}
            onClose={onClose}
        />
    );
};

SendTransaction.propTypes = {
    asset: PropTypes.shape({
        address: PropTypes.string.isRequired,
        code: PropTypes.string,
        icon: PropTypes.string,
    }).isRequired,
    sender: PropTypes.string.isRequired,
    transactions: PropTypes.arrayOf(PropTypes.shape({
        amount: PropTypes.number.isRequired,
        to: PropTypes.string.isRequired,
    })).isRequired,
    amount: PropTypes.number.isRequired,
    initialStep: PropTypes.number,
    initialTask: PropTypes.number,
    autoStart: PropTypes.bool,
    goNext: PropTypes.func,
    goBack: PropTypes.func,
    onClose: PropTypes.func,
};

SendTransaction.defaultProps = {
    initialStep: -1,
    initialTask: 0,
    autoStart: false,
    goNext: null,
    goBack: null,
    onClose: null,
};

export default SendTransaction;
