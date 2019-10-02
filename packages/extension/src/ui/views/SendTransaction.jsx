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
                run: apis.mock,
            },
        ],
    },
    {
        titleKey: 'transaction.step.approve',
        tasks: [
            {
                type: 'sign',
                name: 'approve',
                run: apis.mock,
            },
        ],
    },
    {
        titleKey: 'transaction.step.send',
        tasks: [
            {
                name: 'send',
                run: apis.mock,
            },
        ],
    },
    {
        titleKey: 'transaction.step.confirmed',
    },
];

const SendTransaction = ({
    asset,
    user,
    transactions,
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

    const totalAmount = transactions.reduce((accum, {
        amount,
    }) => accum + amount, 0);

    const [firstTransaction, ...rest] = transactions;
    const firstUser = firstTransaction.account;
    const moreItems = rest.map(({
        amount,
        account: {
            address,
        },
    }) => `${formatAddress(address, 6, 4)} (+${formatValue(code, amount)})`);

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
                    description: formatAddress(firstUser.address, 6, 4),
                    moreItems,
                }}
                size="s"
                actionIconName="send"
            />
        </div>
    );

    const initialData = {
        asset,
        user,
        transactions,
    };

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
    user: PropTypes.shape({
        address: PropTypes.string.isRequired,
    }).isRequired,
    transactions: PropTypes.arrayOf(PropTypes.shape({
        amount: PropTypes.number.isRequired,
        account: PropTypes.shape({
            address: PropTypes.string.isRequired,
        }).isRequired,
    })).isRequired,
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
