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
import ListItem from '~ui/components/ListItem'; import Separator from '~ui/components/Separator';
import InplacePopup from '~ui/components/InplacePopup';

const SendConfirm = ({
    asset,
    sender,
    transactions,
    amount: totalAmount,
    goNext,
    goBack,
    onClose,
}) => (
    <PopupContent
        theme="white"
        title={i18n.t('send.transaction')}
        leftIconName={goBack ? 'chevron_left' : 'close'}
        onClickLeftIcon={goBack || onClose}
        submitButtonText={i18n.t('send')}
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
                            title={i18n.t('asset.send.from')}
                            content={(
                                <ListItem
                                    profile={{
                                        type: 'user',
                                        address: sender,
                                    }}
                                    content={formatAddress(sender, 10, 6)}
                                    textSize="inherit"
                                    size="xxs"
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
                                    size="xxs"
                                    textSize="inherit"
                                />
                            )}
                        />
                        <ListRow
                            title={i18n.t('asset.amount.total')}
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

SendConfirm.propTypes = {
    asset: assetShape.isRequired,
    sender: PropTypes.string.isRequired,
    transactions: PropTypes.arrayOf(PropTypes.shape({
        amount: PropTypes.number.isRequired,
        to: PropTypes.string.isRequired,
    })).isRequired,
    amount: PropTypes.number.isRequired,
    goNext: PropTypes.func.isRequired,
    goBack: PropTypes.func,
    onClose: PropTypes.func,
};

SendConfirm.defaultProps = {
    goBack: null,
    onClose: null,
};

export default SendConfirm;
