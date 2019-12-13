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
    description,
    descriptionKey,
    explain,
    explainKey,
    asset,
    amount,
    requestedAllowance,
    spenderName,
}) => (
    <PopupContent
        title={(
            <Text
                text={title || i18n.t(titleKey, {
                    spender: spenderName,
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
        description={description || i18n.t(
            descriptionKey || [
                'erc20.allowance.approve.description',
                requestedAllowance.eq(new BN(amount))
                    ? ''
                    : '.withNoteValue',
            ].join(''),
            {
                noteValue: formatNumber(amount),
            },
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
                text={explain
                    || i18n.t(explainKey, {
                        spender: spenderName,
                    })
                }
                size="s"
            />
        </Block>
    </PopupContent>
);

ERC20AllowanceApprove.propTypes = {
    title: PropTypes.string,
    titleKey: PropTypes.string,
    description: PropTypes.string,
    descriptionKey: PropTypes.string,
    explain: PropTypes.string,
    explainKey: PropTypes.string,
    asset: assetShape.isRequired,
    amount: PropTypes.number.isRequired,
    requestedAllowance: bigNumberType.isRequired,
    spenderName: PropTypes.string,
};

ERC20AllowanceApprove.defaultProps = {
    title: '',
    titleKey: 'erc20.allowance.approve.title',
    description: '',
    descriptionKey: '',
    explain: '',
    explainKey: '',
    spenderName: '',
};

export default ERC20AllowanceApprove;
