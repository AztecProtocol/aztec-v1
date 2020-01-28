import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    Text,
    SVG,
} from '@aztec/guacamole-ui';
import {
    assetShape,
} from '~/ui/config/propTypes';
import {
    capitalize,
} from '~/utils/format';
import i18n from '~/ui/helpers/i18n';
import noteValueToToken from '~/ui/utils/noteValueToToken';
import isStepAfter from '~/ui/utils/isStepAfter';
import StepContentHelper from '~/ui/views/handlers/StepContentHelper';
import StepContent from '~/ui/components/StepContent';
import EntityBlock from '~/ui/components/AnimatedBlocks/EntityBlock';
import BlockStatus from '~/ui/components/AnimatedBlocks/BlockStatus';
import RecipientList from '~/ui/components/RecipientList';
import HashText from '~/ui/components/HashText';
import SignatureRequestBlock from '~/ui/components/SignatureRequestBlock';
import accessGlyph from '~/ui/images/access.svg';
import {
    iconSizeMap,
    colorMap,
} from '~/ui/styles/guacamole-vars';

class CreateNoteFromBalanceContent extends StepContentHelper {
    getBlockConfig() {
        const {
            steps,
            currentStep,
            asset,
            amount,
            userAccessAccounts,
        } = this.props;

        const currentStepName = steps[currentStep].name;
        const approved = isStepAfter(steps, currentStepName, 'approve');
        const signed = isStepAfter(steps, currentStepName, 'signNotes');

        const {
            symbol,
        } = asset;

        const tokenValue = noteValueToToken(amount, asset);

        const recipients = userAccessAccounts.map(({
            address,
        }) => ({
            address,
            footnote: (
                <SVG
                    glyph={accessGlyph}
                    fill={colorMap.green}
                    width={iconSizeMap.m}
                    height={iconSizeMap.m}
                />
            ),
        }));

        return {
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
            hideTitile: approved,
            content: symbol
                ? `${tokenValue} Zk${symbol}`
                : i18n.count('zkToken', tokenValue, true),
            contentFootnote: (
                <BlockStatus
                    text={i18n.t('send.approved')}
                />
            ),
            hideContentFootnote: !signed,
            profile: {
                ...asset,
                type: 'asset',
            },
            extraContent: (
                <Block padding="xs 0">
                    <Block padding="xs">
                        <Text
                            text={i18n.t('note.access.recipient.title')}
                            color="label"
                            size="xxs"
                        />
                    </Block>
                    <Block padding="s">
                        <RecipientList recipients={recipients} />
                    </Block>
                </Block>
            ),
        };
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
        const {
            name: currentStepName,
            showTaskList,
        } = this.getCurrentStep();
        const stepConfig = this.getStepConfig();
        const blockConfig = this.getBlockConfig();
        const showSignature = isStepAfter(steps, currentStepName, 'approve')
            && !isStepAfter(steps, currentStepName, 'confirm');

        return (
            <StepContent
                {...stepConfig}
            >
                <EntityBlock
                    {...blockConfig}
                />
                {showSignature && (
                    <Block top="xl" bottom="s">
                        {this.renderSignature()}
                    </Block>
                )}
                {showTaskList && this.renderTaskList()}
            </StepContent>
        );
    }
}

CreateNoteFromBalanceContent.propTypes = {
    asset: assetShape.isRequired,
    amount: PropTypes.number.isRequired,
    userAccessAccounts: PropTypes.arrayOf(PropTypes.shape({
        address: PropTypes.string.isRequired,
    })).isRequired,
    proof: PropTypes.shape({
        proofHash: PropTypes.string.isRequired,
        spender: PropTypes.string.isRequired,
    }),
};

CreateNoteFromBalanceContent.defaultProps = {
    titleKey: 'note.access.grant.title',
};

export default CreateNoteFromBalanceContent;
