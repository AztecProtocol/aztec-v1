import React from 'react';
import PropTypes from 'prop-types';
import {
    Text,
} from '@aztec/guacamole-ui';
import {
    assetShape,
    transactionShape,
} from '~/ui/config/propTypes';
import {
    capitalize,
} from '~/utils/format';
import i18n from '~/ui/helpers/i18n';
import noteValueToToken from '~/ui/utils/noteValueToToken';
import isStepAfter from '~/ui/utils/isStepAfter';
import StepContentHelper from '~/ui/views/handlers/StepContentHelper';
import StepContent from '~/ui/components/StepContent';
import AnimatedBlocks from '~/ui/components/AnimatedBlocks';
import BlockStatus from '~/ui/components/AnimatedBlocks/BlockStatus';
import RecipientList from '~/ui/components/RecipientList';
import HashText from '~/ui/components/HashText';

class DepositContent extends StepContentHelper {
    getBlockConfig() {
        const {
            steps,
            currentStep,
            asset,
            amount,
            transactions,
            userAccessAccounts,
            loading,
            error,
        } = this.props;

        const currentStepName = steps[currentStep].name;
        const approved = steps.every(({ name }) => name !== 'approveERC20' && name !== 'permitERC20')
            || isStepAfter(steps, currentStepName, 'approveERC20') || isStepAfter(steps, currentStepName, 'permitERC20');

        const {
            name: assetName,
            symbol,
        } = asset;

        const tokenValue = noteValueToToken(amount, asset);

        const recipients = transactions.map(({
            to,
            amount: txAmount,
        }) => ({
            address: to,
            footnote: (
                <Text
                    className="text-code"
                    text={noteValueToToken(txAmount, asset)}
                    color="label"
                    weight="semibold"
                />
            ),
        }));

        return [
            {
                title: [
                    assetName || capitalize(i18n.singular('token')),
                    ' (',
                    <HashText
                        key="address"
                        size="xs"
                        text={asset.linkedTokenAddress}
                        prefixLength={10}
                        suffixLength={4}
                        clickToCopy
                    />,
                    ')',
                ],
                content: symbol
                    ? `${tokenValue} ${symbol}`
                    : i18n.count('token', tokenValue, true),
                contentFootnote: (
                    <BlockStatus
                        status={approved ? 'check' : 'loading'}
                        text={i18n.t('deposit.approve.allowance')}
                    />
                ),
                hideContentFootnote: !approved && (!loading || !!error),
                profile: {
                    ...asset,
                    type: 'token',
                },
            },
            {
                title: [
                    symbol
                        ? i18n.t('zkSymbol', { symbol })
                        : capitalize(i18n.singular('zkAsset')),
                    ' (',
                    <HashText
                        key="address"
                        size="xs"
                        text={asset.address}
                        prefixLength={10}
                        suffixLength={4}
                        clickToCopy
                    />,
                    ')',
                ],
                content: symbol
                    ? `${tokenValue} ${i18n.t('zkSymbol', { symbol })}`
                    : i18n.count('zkToken', tokenValue, true),
                profile: {
                    ...asset,
                    type: 'asset',
                },
                extraContent: [
                    <RecipientList
                        key="recipients"
                        recipients={recipients}
                    />,
                    currentStep === 0 && userAccessAccounts.length
                        ? (
                            <RecipientList
                                key="access"
                                title={i18n.t('note.access.user')}
                                description={i18n.t('note.access.user.description')}
                                recipients={userAccessAccounts}
                            />
                        )
                        : null,
                ],
            },
        ];
    }

    render() {
        const step = this.getCurrentStep();
        const stepConfig = this.getStepConfig();
        const blocks = this.getBlockConfig();

        return (
            <StepContent
                {...stepConfig}
            >
                <AnimatedBlocks
                    type={step.blockStyle}
                    blocks={blocks}
                    sealedIcon="aztec"
                />
                {step.showTaskList && this.renderTaskList()}
            </StepContent>
        );
    }
}

DepositContent.propTypes = {
    asset: assetShape.isRequired,
    amount: PropTypes.number.isRequired,
    transactions: PropTypes.arrayOf(transactionShape).isRequired,
    userAccessAccounts: PropTypes.arrayOf(PropTypes.shape({
        address: PropTypes.string.isRequired,
    })),
};

DepositContent.defaultProps = {
    titleKey: 'deposit.title',
    userAccessAccounts: [],
};

export default DepositContent;
