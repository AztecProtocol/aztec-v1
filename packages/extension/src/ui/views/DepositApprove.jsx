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
