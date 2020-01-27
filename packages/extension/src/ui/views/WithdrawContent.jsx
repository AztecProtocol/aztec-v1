import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    Text,
} from '@aztec/guacamole-ui';
import {
    assetShape,
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
import SignatureRequestBlock from '~/ui/components/SignatureRequestBlock';
import BlockStatus from '~/ui/components/AnimatedBlocks/BlockStatus';
import RecipientList from '~/ui/components/RecipientList';
import HashText from '~/ui/components/HashText';

class WithdrawContent extends StepContentHelper {
    getBlockConfig() {
        const {
            steps,
            currentStep,
            asset,
            amount,
            publicOwner,
        } = this.props;

        const currentStepName = steps[currentStep].name;
        const approved = isStepAfter(steps, currentStepName, 'approve');

        const {
            name: assetName,
            symbol,
        } = asset;

        const tokenValue = noteValueToToken(amount, asset);

        const recipients = [
            {
                address: publicOwner,
                footnote: (
                    <Text
                        className="text-code"
                        text={formatNumber(noteValueToToken(amount, asset))}
                        color="label"
                        weight="semibold"
                    />
                ),
            },
        ];

        return [
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
            },
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
                extraContent: (
                    <Block padding="l s">
                        <RecipientList recipients={recipients} />
                    </Block>
                ),
            },
        ];
    }

    renderSignature() {
        const {
            proof: {
                proofHash,
                spender,
            },
        } = this.props;
        const step = this.getCurrentStep();
        const signed = step.name === 'confirm';
        const signatures = {
            proofHash,
            spender,
        };

        return (
            <SignatureRequestBlock
                signatures={signatures}
                signed={signed}
            />
        );
    }

    render() {
        const {
            steps,
        } = this.props;
        const step = this.getCurrentStep();
        const stepConfig = this.getStepConfig();
        const blocks = this.getBlockConfig();
        const currentStepName = step.name;
        const showSignature = isStepAfter(steps, currentStepName, 'approve')
            && !isStepAfter(steps, currentStepName, 'confirm');

        return (
            <StepContent
                {...stepConfig}
            >
                <AnimatedBlocks
                    type={step.blockStyle}
                    blocks={blocks}
                    sealedIcon="aztec"
                />
                {showSignature && (
                    <Block top="xl">
                        {this.renderSignature()}
                    </Block>
                )}
                {step.blockStyle === 'sealed' && this.renderTaskList()}
            </StepContent>
        );
    }
}

WithdrawContent.propTypes = {
    asset: assetShape.isRequired,
    amount: PropTypes.number.isRequired,
    publicOwner: PropTypes.string.isRequired,
    proof: PropTypes.shape({
        proofHash: PropTypes.string.isRequired,
        spender: PropTypes.string.isRequired,
    }),
};

WithdrawContent.defaultProps = {
    titleKey: 'withdraw.title',
    proof: null,
};

export default WithdrawContent;
