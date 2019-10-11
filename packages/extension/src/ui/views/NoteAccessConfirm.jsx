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
import {
    formatValue,
} from '~ui/utils/asset';
import formatAddress from '~ui/utils/formatAddress';
import Popup from '~ui/components/Popup';
import Ticket from '~ui/components/Ticket';
import ListRow from '~ui/components/ListRow';
import ListItem from '~ui/components/ListItem';
import Separator from '~ui/components/Separator';
import InplacePopup from '~ui/components/InplacePopup';

const NoteAccessConfirm = ({
    note,
    accounts,
    goNext,
    goBack,
    onClose,
}) => {
    const {
        hash,
        value,
        asset,
    } = note;

    return (
        <Popup
            theme="white"
            title={i18n.t('note.access.grant.title')}
            leftIconName={goBack ? 'chevron_left' : 'close'}
            onClickLeftIcon={goBack || onClose}
            submitButtonText={i18n.t('note.access.grant')}
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
                        <Offset top="xs">
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
                                title={i18n.t('note.hash')}
                                content={formatAddress(hash, 10, 6)}
                            />
                            <ListRow
                                title={i18n.t('note.value')}
                                content={formatValue(asset.code, value)}
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
                                    items={accounts}
                                    renderItem={({ address }) => (
                                        <ListItem
                                            className="text-code"
                                            profile={{
                                                type: 'user',
                                                address,
                                            }}
                                            content={formatAddress(address, 18, 8)}
                                            size="xxs"
                                            color="label"
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
        </Popup>
    );
};

NoteAccessConfirm.propTypes = {
    note: PropTypes.shape({
        hash: PropTypes.string.isRequired,
        value: PropTypes.number.isRequired,
        asset: assetShape.isRequired,
    }).isRequired,
    accounts: PropTypes.arrayOf(PropTypes.shape({
        address: PropTypes.string.isRequired,
    })).isRequired,
    goNext: PropTypes.func.isRequired,
    goBack: PropTypes.func,
    onClose: PropTypes.func,
};

NoteAccessConfirm.defaultProps = {
    goBack: null,
    onClose: null,
};

export default NoteAccessConfirm;
