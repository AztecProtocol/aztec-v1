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
import Ticket from '~ui/components/Ticket';
import ListRow from '~ui/components/ListRow';
import ListItem from '~ui/components/ListItem';
import Separator from '~ui/components/Separator';
import InplacePopup from '~ui/components/InplacePopup';

const DepositConfirm = ({
    asset,
    from: fromAddress,
    transactions,
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
            <Ticket height={3}>
                <Block padding="0 s">
                    <ListRow
                        title={i18n.t('deposit.from')}
                        content={(
                            <ListItem
                                className="text-code"
                                profile={{
                                    type: 'user',
                                    address: fromAddress,
                                }}
                                content={formatAddress(fromAddress, 10, 6)}
                                textSize="inherit"
                                size="xxs"
                            />
                        )}
                    />
                    <ListRow
                        title={i18n.t('asset')}
                        content={(
                            <ListItem
                                className="text-code"
                                profile={{
                                    ...asset,
                                    type: 'asset',
                                }}
                                content={formatAddress(asset.address, 10, 6)}
                                textSize="inherit"
                                size="xxs"
                            />
                        )}
                    />
                    <ListRow
                        title={i18n.t('deposit.amount.total')}
                        content={formatValue(asset.code, totalAmount)}
                    />
                </Block>
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
                    text={i18n.t('deposit.confirm.explain')}
                    size="xxs"
                    color="label"
                />
            </Block>
        </FlexBox>
    </PopupContent>
);

DepositConfirm.propTypes = {
    asset: PropTypes.shape({
        address: PropTypes.string.isRequired,
        code: PropTypes.string,
    }).isRequired,
    from: PropTypes.string.isRequired,
    transactions: PropTypes.arrayOf(PropTypes.shape({
        amount: PropTypes.number.isRequired,
        to: PropTypes.string.isRequired,
    })).isRequired,
    amount: PropTypes.number.isRequired,
};


export default DepositConfirm;
