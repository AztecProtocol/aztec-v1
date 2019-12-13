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
import formatNumber from '~/ui/utils/formatNumber';
import i18n from '~ui/helpers/i18n';
import approveGlyph from '~ui/images/approve.svg';
import PopupContent from '~ui/components/PopupContent';

const DepositApprove = ({
    asset,
    amount: totalAmount,
}) => (
    <PopupContent
        title={(
            <div>
                <Text
                    text={i18n.t('deposit.approve.amount')}
                    size="xl"
                    weight="light"
                />
                <Block padding="0 s" inline>
                    <Text
                        text={formatNumber(totalAmount, asset.decimals)}
                        size="xl"
                        weight="bold"
                    />
                </Block>
                <Text
                    text={asset.name || i18n.t('erc20.token', totalAmount)}
                    size="xl"
                    weight="light"
                />
            </div>
        )}
    >
        <Block padding="l 0">
            <SVG
                glyph={approveGlyph}
                width={80}
                height={80}
            />
        </Block>
        <Block padding="l">
            <Text
                text={i18n.t('deposit.approve.explain')}
                size="s"
            />
        </Block>
    </PopupContent>
);

DepositApprove.propTypes = {
    asset: assetShape.isRequired,
    amount: PropTypes.number.isRequired,
};

export default DepositApprove;
