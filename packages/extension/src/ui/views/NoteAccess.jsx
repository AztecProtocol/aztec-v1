import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    FlexBox,
    Text,
} from '@aztec/guacamole-ui';
import i18n from '~ui/helpers/i18n';
import {
    name,
    icon,
    formatValue,
} from '~ui/utils/asset';
import formatAddress from '~ui/utils/formatAddress';
import Popup from '~ui/components/Popup';
import Ticket from '~ui/components/Ticket';
import ListRow from '~ui/components/ListRow';
import AddressRow from '~ui/components/AddressRow';
import ProfileIcon from '~ui/components/ProfileIcon';
import Separator from '~ui/components/Separator';
import InplacePopup from '~ui/components/InplacePopup';

const NoteAccess = ({
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
    const {
        code,
        address: assetAddress,
    } = asset;

    const assetInfoNode = (
        <FlexBox valign="center" nowrap>
            <ProfileIcon
                src={icon(code)}
                size="xs"
            />
            <Block left="xs">
                <Text
                    text={`${name(code)} (${formatAddress(assetAddress)})`}
                />
            </Block>
        </FlexBox>
    );

    return (
        <Popup
            theme="white"
            title={i18n.t('note.access.grant.title')}
            leftIconName={goBack ? 'chevron_left' : 'close'}
            onClickLeftIcon={goBack || onClose}
            submitButtonText={i18n.t('note.access.grant')}
            onSubmit={goNext}
        >
            <Ticket height={2}>
                <ListRow
                    title={i18n.t('note.hash')}
                    content={formatAddress(hash, 10, 6)}
                />
                <ListRow
                    title={i18n.t('note.value')}
                    content={formatValue(code, value)}
                />
                <ListRow
                    title={i18n.t('asset')}
                    content={assetInfoNode}
                />
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
                            renderItem={({ address }) => <AddressRow address={address} />}
                            itemMargin="xs 0"
                            margin="xs m"
                            numberOfVisibleItems={2}
                        />
                    </Block>
                </Block>
                <Block top={accounts.length > 1 ? 's' : 'l'}>
                    <Text
                        text={i18n.t('note.access.grant.explain')}
                        size="xs"
                        color="label"
                    />
                </Block>
            </Block>
        </Popup>
    );
};

NoteAccess.propTypes = {
    note: PropTypes.shape({
        hash: PropTypes.string.isRequired,
        value: PropTypes.number.isRequired,
        asset: PropTypes.shape({
            code: PropTypes.string.isRequired,
            address: PropTypes.string.isRequired,
        }).isRequired,
    }).isRequired,
    accounts: PropTypes.arrayOf(PropTypes.shape({
        address: PropTypes.string.isRequired,
    })).isRequired,
    goNext: PropTypes.func.isRequired,
    goBack: PropTypes.func,
    onClose: PropTypes.func,
};

NoteAccess.defaultProps = {
    goBack: null,
    onClose: null,
};

export default NoteAccess;
