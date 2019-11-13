import React from 'react';
import PropTypes from 'prop-types';
import {
    FlexBox,
    Block,
    Offset,
    Text,
} from '@aztec/guacamole-ui';
import {
    assetShape,
} from '~ui/config/propTypes';
import i18n from '~ui/helpers/i18n';
import formatAddress from '~ui/utils/formatAddress';
import {
    formatValue,
} from '~ui/utils/asset';
import PopupContent from '~ui/components/PopupContent';
import Ticket from '~ui/components/Ticket';
import ListRow from '~ui/components/ListRow';
import ListItem from '~ui/components/ListItem';
import Separator from '~ui/components/Separator';
import InplacePopup from '~ui/components/InplacePopup';

const SendConfirm = ({
    asset,
    sender,
    transactions,
    totalAmount,
}) => (
    <PopupContent
        theme="white"
        title={i18n.t('send.transaction')}
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
            <Block padding="0 m xl m">
                <Text
                    text={i18n.t('send.confirm.sendAmount')}
                    size="xl"
                    weight="light"
                />
                <Block padding="0 s" inline>
                    <Text
                        text={totalAmount}
                        size="xl"
                        weight="bold"
                    />
                </Block>
                <Text
                    text={asset.name || i18n.t('asset.zkNotes')}
                    size="xl"
                    weight="light"
                />
            </Block>
            <Ticket height={2}>
                <Offset margin="xs 0">
                    <ListRow
                        title={i18n.t('asset.send.from')}
                        content={(
                            <ListItem
                                profile={{
                                    type: 'user',
                                    address: sender,
                                }}
                                content={formatAddress(sender, 10, 6)}
                                color="black"
                                textSize="inherit"
                                size="xs"
                            />
                        )}
                    />
                    <ListRow
                        title={i18n.t('asset')}
                        content={(
                            <ListItem
                                profile={{
                                    ...asset,
                                    type: 'asset',
                                }}
                                content={formatAddress(asset.address, 10, 6)}
                                color="black"
                                size="xs"
                                textSize="inherit"
                            />
                        )}
                    />
                    <ListRow
                        title={i18n.t('deposit.amount.total')}
                        content={<Text text={formatValue(asset.code, totalAmount)} color="primary" size="m" />}
                    />
                </Offset>
            </Ticket>
            <Block padding="0 xl">
                <Block top="xl">
                    <Separator
                        theme="white"
                        title={i18n.t('to')}
                    />
                    <Block padding="m 0">
                        <InplacePopup
                            theme="white"
                            items={transactions}
                            renderItem={({
                                amount,
                                to,
                            }) => (
                                <ListItem
                                    className="text-code"
                                    profile={{
                                        type: 'user',
                                        address: to,
                                    }}
                                    content={formatAddress(to, 12, 6)}
                                    size="xxs"
                                    color="label"
                                    footnote={(
                                        <Text
                                            text={`+${formatValue(asset.code, amount)}`}
                                            color="green"
                                        />
                                    )}
                                />
                            )}
                            itemMargin="xs 0"
                            margin="xs m"
                            numberOfVisibleItems={2}
                        />
                    </Block>
                </Block>
            </Block>
            <Block padding="0 xl">
                <Text
                    text={i18n.t('send.confirm.explain')}
                    size="s"
                />
            </Block>
        </FlexBox>
    </PopupContent>
);

SendConfirm.propTypes = {
    asset: assetShape.isRequired,
    sender: PropTypes.string.isRequired,
    transactions: PropTypes.arrayOf(PropTypes.shape({
        amount: PropTypes.number.isRequired,
        to: PropTypes.string.isRequired,
    })).isRequired,
    totalAmount: PropTypes.number.isRequired,
};

export default SendConfirm;
