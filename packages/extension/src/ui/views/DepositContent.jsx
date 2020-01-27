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
import formatNumber from '~/ui/utils/formatNumber';
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
        } = this.props;

        const currentStepName = steps[currentStep].name;
        const approved = isStepAfter(steps, currentStepName, 'approveERC20');

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
                    text={formatNumber(noteValueToToken(txAmount, asset))}
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
                        text={i18n.t('deposit.approve.allowance')}
                        iconName="check"
                    />
                ),
                hideContentFootnote: !approved,
                profile: {
                    ...asset,
                    type: 'token',
                },
            },
            {
                title: [
                    symbol
                        ? `Zk${symbol}`
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
                    ? `${tokenValue} Zk${symbol}`
                    : i18n.count('zkToken', tokenValue, true),
                profile: {
                    ...asset,
                    type: 'asset',
                },
                extraContent: <RecipientList recipients={recipients} />,
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
                {step.blockStyle === 'sealed' && this.renderTaskList()}
            </StepContent>
        );
    }
}

DepositContent.propTypes = {
    asset: assetShape.isRequired,
    amount: PropTypes.number.isRequired,
    transactions: PropTypes.arrayOf(transactionShape).isRequired,
};

DepositContent.defaultProps = {
    titleKey: 'deposit.title',
};

export default DepositContent;
