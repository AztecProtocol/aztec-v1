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
import ListItem from '~ui/components/ListItem';
import Connection from '~ui/components/Connection';
import PopupContent from '~ui/components/PopupContent';

const SendSend = ({
    asset: {
        code,
        address: assetAddress,
        linkedTokenAddress,
    },
    totalAmount,
    transactions,
}) => {
    const [firstTransaction, ...rest] = transactions;
    const moreItems = rest.map(({
        amount,
        to,
    }, i) => (
        <ListItem
            key={+i}
            profile={{
                type: 'user',
                address: to,
            }}
            content={formatAddress(to, 6, 4)}
            size="xxs"
            footnote={(
                <Text
                    text={`+${formatValue(code, amount)}`}
                    color="green"
                />
            )}
        />
    ));


    return (

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
                    <Block bottom="s">
                        <Text
                            text={formatValue(code, totalAmount)}
                            size="m"
                            color="primary"
                            weight="semibold"
                        />
                    </Block>
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
                            moreItems,
                        }}
                        size="s"
                        actionIconName="send"
                    />
                </Block>

                <Block padding="0 xl">
                    <Text
                        text={i18n.t('withdraw.send.explain')}
                        size="xxs"
                        color="label"
                    />
                </Block>
            </FlexBox>
        </PopupContent>
    );
};
SendSend.propTypes = {
    asset: PropTypes.shape({
        address: PropTypes.string.isRequired,
        code: PropTypes.string,
    }).isRequired,
    transactions: PropTypes.arrayOf(PropTypes.shape({
        amount: PropTypes.number.isRequired,
        to: PropTypes.string.isRequired,
    })).isRequired,
};

export default SendSend;
