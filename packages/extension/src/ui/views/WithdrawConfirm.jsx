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
                    text={i18n.t('withdraw.confirm.amount')}
                    size="xl"
                    weight="light"
                />
                <Text
                    text={firstTransaction.amount}
                    size="xl"
                    weight="bold"
                />
                <Text
                    text={name || ' ERC20 Tokens'}
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
    asset: PropTypes.shape({
        address: PropTypes.string.isRequired,
        code: PropTypes.string,
        linkedTokenAddress: PropTypes.string.isRequired,
    }).isRequired,
    transactions: PropTypes.arrayOf(
        PropTypes.shape({
            to: PropTypes.string.isRequired,
            amount: PropTypes.number.isRequired,
        }),
    ).isRequired,
};

export default WithdrawConfirm;
