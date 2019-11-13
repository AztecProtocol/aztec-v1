import React from 'react';
import PropTypes from 'prop-types';
import {
    FlexBox,
    Block,
    Text,
} from '@aztec/guacamole-ui';
import i18n from '~ui/helpers/i18n';
import {
    formatValue,
} from '~ui/utils/asset';
import {
    assetShape,
} from '~/ui/config/propTypes';
import formatAddress from '~ui/utils/formatAddress';
import PopupContent from '~ui/components/PopupContent';
import Connection from '~ui/components/Connection';
import ListItem from '~ui/components/ListItem';
import Ticket from '~ui/components/Ticket';

const WithdrawConfirm = ({
    asset: {
        address: assetAddress,
        name,
        linkedTokenAddress,
        code,
    },
    transactions: [firstTransaction],
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
                    text={i18n.t('withdraw.confirm.title')}
                    size="xl"
                    weight="light"
                />
                <Block padding="0 s" inline>
                    <Text
                        text={firstTransaction.amount}
                        size="xl"
                        weight="bold"
                    />
                </Block>
                <Text
                    text={name || i18n.t('asset.erc20.token')}
                    size="xl"
                    weight="light"
                />
            </Block>
            <Ticket height={2}>
                <Connection
                    theme="white"
                    from={{
                        profile: {
                            type: 'asset',
                            address: assetAddress,
                            linkedTokenAddress,
                        },
                        description: formatAddress(assetAddress, 6, 4),
                    }}
                    to={{
                        profile: {
                            type: 'user',
                            address: firstTransaction.to,
                        },
                        tooltip: (
                            <ListItem
                                content={formatAddress(firstTransaction.to, 6, 4)}
                                size="xxs"
                                footnote={(
                                    <Text
                                        text={`+${formatValue(code, firstTransaction.amount)}`}
                                        color="green"
                                    />
                                )}
                            />
                        ),
                        description: formatAddress(firstTransaction.to, 6, 4),
                    }}
                    size="s"
                    actionIconName="double_arrow"
                />
            </Ticket>
            <Block padding="m xl">
                <Text
                    text={i18n.t('withdraw.confirm.explain')}
                    size="s"
                />
            </Block>
        </FlexBox>
    </PopupContent>
);

WithdrawConfirm.propTypes = {
    asset: assetShape.isRequired,
    transactions: PropTypes.arrayOf(
        PropTypes.shape({
            to: PropTypes.string.isRequired,
            amount: PropTypes.number.isRequired,
        }),
    ).isRequired,
};

export default WithdrawConfirm;
