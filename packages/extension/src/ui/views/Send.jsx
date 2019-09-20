import React from 'react';
import PropTypes from 'prop-types';
import numeral from 'numeral';
import {
    Block,
    FlexBox,
    Text,
    Icon,
} from '@aztec/guacamole-ui';
import i18n from '~ui/helpers/i18n';
import AddressRow from '~ui/components/AddressRow';
import apis from '~uiModules/apis';
import Transaction from './handlers/Transaction';

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

const Send = ({
    asset,
    amount,
    fromAddress,
    initialStep,
    initialTask,
    goNext,
    goBack,
    onClose,
}) => {
    const ticketHeader = (
        <div>
            <FlexBox
                valign="center"
            >
                <Block right="m">
                    <Icon
                        name="reply"
                        size="l"
                        color="primary"
                        flipHorizontal
                    />
                </Block>
                <Text
                    text={numeral(amount).format('0,0')}
                    size="m"
                    weight="semibold"
                    color="primary"
                />
            </FlexBox>
            <Block top="s">
                <AddressRow
                    address={fromAddress}
                />
            </Block>
        </div>
    );

    const initialData = {
        asset,
        amount,
    };

    return (
        <Transaction
            title={i18n.t('send.transaction')}
            description={i18n.t('send.transaction.description')}
            ticketHeader={ticketHeader}
            steps={steps}
            initialStep={initialStep}
            initialTask={initialTask}
            initialData={initialData}
            submitButtonText={i18n.t('proof.create')}
            successMessage={i18n.t('transaction.success')}
            goNext={goNext}
            goBack={goBack}
            onClose={onClose}
        />
    );
};

Send.propTypes = {
    asset: PropTypes.shape({
        code: PropTypes.string.isRequired,
        address: PropTypes.string.isRequired,
    }).isRequired,
    fromAddress: PropTypes.string.isRequired,
    // toAddresses: PropTypes.arrayOf(PropTypes.string).isRequired,
    amount: PropTypes.number.isRequired,
    initialStep: PropTypes.number,
    initialTask: PropTypes.number,
    goNext: PropTypes.func,
    goBack: PropTypes.func,
    onClose: PropTypes.func,
};

Send.defaultProps = {
    initialStep: -1,
    initialTask: 0,
    goNext: null,
    goBack: null,
    onClose: null,
};

export default Send;
