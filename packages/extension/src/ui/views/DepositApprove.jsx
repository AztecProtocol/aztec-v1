import React from 'react';
import PropTypes from 'prop-types';
import {
    FlexBox,
    Block,
    Text,
} from '@aztec/guacamole-ui';
import i18n from '~ui/helpers/i18n';
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
            valign="center"
            className="flex-free-expand"
            expand
            stretch
            nowrap
        >
            <Block padding="m xl">
                <Text
                    text={i18n.t('deposit.approve.amount', {
                        totalAmount,
                        assetName: asset.name || 'ERC20',
                    })}
                    size="xl"
                    weight="semibold"
                />
            </Block>
            <Block padding="m xl">
                <Text
                    text={i18n.t('deposit.approve.explain')}
                    size="xxs"
                    color="label"
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
