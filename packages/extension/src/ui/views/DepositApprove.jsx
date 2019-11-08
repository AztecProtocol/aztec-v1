import React from 'react';
import PropTypes from 'prop-types';
import {
    FlexBox,
    Block,
    Text,
    SVG,
} from '@aztec/guacamole-ui';
import i18n from '~ui/helpers/i18n';
import approveGlyph from '~ui/images/approve.svg';
import PopupContent from '~ui/components/PopupContent';

const DepositApprove = ({
    asset,
    amount: totalAmount,
}) => (
    <PopupContent
        theme="white"
    >
        <FlexBox
            direction="column"
            align="center"
            className="flex-free-expand"
            expand
            stretch
            nowrap
        >
            <Block padding="0 s l s">
                <Text
                    text={i18n.t('deposit.approve.amount')}
                    size="xl"
                    weight="light"
                />
                <Text
                    text={totalAmount}
                    size="xl"
                    weight="bold"
                />
                <Text
                    text={asset.name || ' ERC20 Tokens'}
                    size="xl"
                    weight="light"
                />
            </Block>
            <Block padding="l 0 l 0">
                <SVG
                    glyph={approveGlyph}
                    width={80}
                    height={80}
                />
            </Block>
            <Block padding="l m">
                <Text
                    text={i18n.t('deposit.approve.explain')}
                    size="s"
                />
            </Block>
        </FlexBox>
    </PopupContent>
);

DepositApprove.propTypes = {
    asset: PropTypes.shape({
        address: PropTypes.string.isRequired,
        code: PropTypes.string,
    }).isRequired,
    amount: PropTypes.number.isRequired,
};

export default DepositApprove;
