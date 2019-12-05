import React from 'react';
import PropTypes from 'prop-types';
import {
    FlexBox,
    Block,
    Text,
} from '@aztec/guacamole-ui';
import {
    assetShape,
    transactionShape,
} from '~ui/config/propTypes';
import i18n from '~ui/helpers/i18n';
import formatNumber from '~ui/utils/formatNumber';
import PopupContent from '~ui/components/PopupContent';
import Ticket from '~ui/components/Ticket';
import ListRow from '~ui/components/ListRow';
import ListItem from '~ui/components/ListItem';
import Separator from '~ui/components/Separator';
import HashText from '~/ui/components/HashText';

const SendConfirm = ({
    asset,
    sender,
    transactions,
    totalAmount,
}) => (
    <PopupContent
        title={(
            <div>
                <Text
                    text={i18n.t('send.confirm.sendAmount')}
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
                    text={asset.name || i18n.t('asset.zkNotes')}
                    size="xl"
                    weight="light"
                />
            </div>
        )}
    >
        <Block padding="m 0">
            <Ticket
                height={3}
                align="center"
            >
                <FlexBox
                    direction="column"
                    align="space-between"
                    valign="flex-start"
                    stretch
                >
                    <ListRow
                        title={i18n.t('asset.send.from')}
                        content={(
                            <ListItem
                                profile={{
                                    type: 'user',
                                    address: sender,
                                }}
                                content={(
                                    <HashText
                                        text={sender}
                                        prefixLength={10}
                                        suffixLength={4}
                                        size="s"
                                    />
                                )}
                                size="xxs"
                                textSize="xs"
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
                                content={(
                                    <div>
                                        {asset.name ? `${asset.name} (` : ''}
                                        <HashText
                                            text={asset.address}
                                            prefixLength={asset.name ? 6 : 10}
                                            suffixLength={4}
                                            size="s"
                                        />
                                        {asset.name ? ')' : ''}
                                    </div>
                                )}
                                size="xxs"
                                textSize="xs"
                            />
                        )}
                    />
                    <ListRow
                        title={i18n.t('deposit.amount.total')}
                        content={formatNumber(totalAmount, asset.decimals)}
                        size="xs"
                        contentSize="s"
                        color="green"
                    />
                </FlexBox>
            </Ticket>
        </Block>
        <Block padding="m xl">
            <Separator
                theme="white"
                title={i18n.t('to')}
            />
            <Block padding="m 0">
                {transactions.map(({
                    amount,
                    to,
                }, i) => (
                    <Block
                        key={+i}
                        padding="s 0"
                    >
                        <ListItem
                            profile={{
                                type: 'user',
                                address: to,
                            }}
                            content={(
                                <HashText
                                    text={to}
                                    prefixLength={10}
                                    suffixLength={4}
                                />
                            )}
                            size="xxs"
                            footnote={(
                                <Text
                                    className="text-code"
                                    text={`+${formatNumber(amount, asset.decimals)}`}
                                    color="green"
                                />
                            )}
                        />
                    </Block>
                ))}
            </Block>
            <Block padding="m 0">
                <Text
                    text={i18n.t('send.confirm.explain')}
                    size="xs"
                    color="label"
                />
            </Block>
        </Block>
    </PopupContent>
);

SendConfirm.propTypes = {
    asset: assetShape.isRequired,
    sender: PropTypes.string.isRequired,
    transactions: PropTypes.arrayOf(transactionShape).isRequired,
    totalAmount: PropTypes.number.isRequired,
};

export default SendConfirm;
