import React from 'react';
import PropTypes from 'prop-types';
import BN from 'bn.js';
import {
    Block,
    Text,
    SVG,
} from '@aztec/guacamole-ui';
import {
    assetShape,
    bigNumberType,
} from '~/ui/config/propTypes';
import formatNumber from '~/ui/utils/formatNumber';
import i18n from '~ui/helpers/i18n';
import approveGlyph from '~ui/images/approve.svg';
import PopupContent from '~ui/components/PopupContent';

const ERC20AllowanceApprove = ({
    title,
    titleKey,
    asset,
    amount,
    requestedAllowance,
}) => (
    <PopupContent
        title={(
            <Text
                text={title || i18n.t(titleKey, {
                    amount: (
                        <Text
                            key="amount"
                            text={formatNumber(requestedAllowance, asset.decimals)}
                            size="xl"
                            weight="bold"
                        />
                    ),
                })}
                size="xl"
                weight="light"
            />
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
                text={i18n.t('deposit.approve.erc20.explain')}
                size="s"
            />
        </Block>
    </PopupContent>
);

ERC20AllowanceApprove.propTypes = {
    title: PropTypes.string,
    titleKey: PropTypes.string,
    asset: assetShape.isRequired,
    amount: PropTypes.number.isRequired,
    requestedAllowance: bigNumberType.isRequired,
};

ERC20AllowanceApprove.defaultProps = {
    title: '',
    titleKey: '', // TODO - add default title in locale
};

export default ERC20AllowanceApprove;
