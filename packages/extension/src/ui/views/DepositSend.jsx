import React from 'react';
import PropTypes from 'prop-types';
import {
    FlexBox,
    Block,
    Text,
    SVG,
} from '@aztec/guacamole-ui';
import i18n from '~ui/helpers/i18n';
import {
    formatValue,
} from '~ui/utils/asset';
import formatAddress from '~ui/utils/formatAddress';
import Connection from '~ui/components/Connection';
import sendGlyph from '~ui/images/send.svg';
import PopupContent from '~ui/components/PopupContent';

const DepositSend = ({
    asset: {
        code,
        address: assetAddress,
        linkedTokenAddress,
    },
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
            <Block padding="0 l l l">
                <Text
                    text={i18n.t('deposit.send.explain')}
                    size="s"
                    weight="light"
                />
            </Block>

            <Block padding="xl 0 xl 0">
                <SVG
                    glyph={sendGlyph}
                    width={100}
                    height={100}
                />
            </Block>
            <Block padding="0 l">
                <Text
                    text={i18n.t('deposit.send.footer')}
                    size="s"
                />
            </Block>

        </FlexBox>
    </PopupContent>
);

DepositSend.propTypes = {
    asset: PropTypes.shape({
        address: PropTypes.string.isRequired,
        code: PropTypes.string,
    }).isRequired,
    amount: PropTypes.number.isRequired,
};

export default DepositSend;
