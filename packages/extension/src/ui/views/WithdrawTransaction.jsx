import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    Text,
} from '@aztec/guacamole-ui';
import {
    icon,
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

const WithdrawTransaction = ({
    asset,
    user,
    amount,
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

    const ticketHeader = (
        <div>
            <Block bottom="s">
                <Text
                    text={formatValue(code, amount)}
                    size="m"
                    color="primary"
                    weight="semibold"
                />
            </Block>
            <Connection
                theme="white"
                from={{
                    type: 'asset',
                    src: icon(code),
                    alt: code,
                    description: formatAddress(assetAddress, 6, 4),
                }}
                to={{
                    type: 'user',
                    description: formatAddress(user.address, 6, 4),
                }}
                size="s"
                actionIconName="double_arrow"
            />
        </div>
    );

    const initialData = {
        asset,
        user,
        amount,
    };

    return (
        <Transaction
            title={i18n.t('withdraw.transaction')}
            description={i18n.t('withdraw.transaction.description')}
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

WithdrawTransaction.propTypes = {
    asset: PropTypes.shape({
        code: PropTypes.string.isRequired,
        address: PropTypes.string.isRequired,
    }).isRequired,
    user: PropTypes.shape({
        address: PropTypes.string.isRequired,
    }).isRequired,
    amount: PropTypes.number.isRequired,
    initialStep: PropTypes.number,
    initialTask: PropTypes.number,
    autoStart: PropTypes.bool,
    goNext: PropTypes.func,
    goBack: PropTypes.func,
    onClose: PropTypes.func,
};

WithdrawTransaction.defaultProps = {
    initialStep: -1,
    initialTask: 0,
    autoStart: false,
    goNext: null,
    goBack: null,
    onClose: null,
};

export default WithdrawTransaction;
