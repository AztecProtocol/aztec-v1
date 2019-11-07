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
import PopupContent from '~ui/components/PopupContent';
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
        noteHash,
        value,
        asset,
    } = note;

    const invalidAccounts = accounts.some(({ linkedPublicKey }) => !linkedPublicKey);

    return (
        <PopupContent
            theme="white"
            error={invalidAccounts ? { key: 'note.access.invalidAccounts' } : undefined}
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
                                content={formatAddress(noteHash, 10, 6)}
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
                                    renderItem={({ address, linkedPublicKey }) => (
                                        <ListItem
                                            className="text-code"
                                            profile={{
                                                type: 'user',
                                                address,
                                            }}
                                            content={formatAddress(address, 18, 8)}
                                            size="xxs"
                                            color={linkedPublicKey ? 'label' : 'red'}
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
};

NoteAccessConfirm.propTypes = {
    note: PropTypes.shape({
        noteHash: PropTypes.string.isRequired,
        value: PropTypes.number.isRequired,
        asset: assetShape.isRequired,
    }).isRequired,
    accounts: PropTypes.arrayOf(PropTypes.shape({
        address: PropTypes.string,
        linkedPublicKey: PropTypes.string,
    })).isRequired,
};


export default NoteAccessConfirm;
