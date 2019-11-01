import React from 'react';
import PropTypes from 'prop-types';
import {
    FlexBox,
    Block,
    Offset,
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
    goNext,
    goBack,
    onClose,
}) => (
    <PopupContent
        theme="white"
        title={i18n.t('deposit.transaction')}
        leftIconName={goBack ? 'chevron_left' : 'close'}
        onClickLeftIcon={goBack || onClose}
        submitButtonText={i18n.t('deposit')}
        onSubmit={goNext}
    >
        <FlexBox
            direction="column"
            align="space-between"
            stretch
            nowrap
        >
            <div>
                <Ticket height={2}>
                    <Offset margin="xs 0">
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
            </div>
            <Block padding="0 xl">
                <Text
                    text={i18n.t('note.access.grant.explain')}
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
    goNext: PropTypes.func.isRequired,
    goBack: PropTypes.func,
    onClose: PropTypes.func,
};

DepositConfirm.defaultProps = {
    goBack: null,
    onClose: null,
};

export default DepositConfirm;
