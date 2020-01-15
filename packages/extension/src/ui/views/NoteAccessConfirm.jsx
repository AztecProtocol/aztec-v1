import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    Text,
} from '@aztec/guacamole-ui';
import {
    assetShape,
} from '~/ui/config/propTypes';
import i18n from '~/ui/helpers/i18n';
import formatNumber from '~/ui/utils/formatNumber';
import PopupContent from '~/ui/components/PopupContent';
import Ticket from '~/ui/components/Ticket';
import ListRow from '~/ui/components/ListRow';
import ListItem from '~/ui/components/ListItem';
import Separator from '~/ui/components/Separator';
import HashText from '~/ui/components/HashText';

const NoteAccessConfirm = ({
    note,
    asset,
    accounts,
}) => {
    const {
        noteHash,
        value,
    } = note;

    const invalidAccounts = accounts.some(({ linkedPublicKey }) => !linkedPublicKey);

    return (
        <PopupContent
            error={invalidAccounts ? { key: 'note.access.invalidAccounts' } : undefined}
        >
            <Block padding="m 0">
                <Ticket
                    height={3}
                    align="center"
                >
                    <Block align="left">
                        <ListRow
                            title={i18n.t('asset')}
                            content={(
                                <ListItem
                                    profile={{
                                        ...asset,
                                        type: 'asset',
                                    }}
                                    content={(
                                        <HashText
                                            text={asset.address}
                                            prefixLength={12}
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
                            title={i18n.t('note')}
                            content={(
                                <ListItem
                                    profile={{
                                        type: 'note',
                                        noteHash,
                                    }}
                                    content={(
                                        <HashText
                                            text={noteHash}
                                            prefixLength={12}
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
                            title={i18n.t('note.value')}
                            content={formatNumber(value)}
                            color="primary"
                        />
                    </Block>
                </Ticket>
            </Block>
            <Block padding="m xl">
                <Separator
                    theme="white"
                    title={i18n.t('to')}
                />
                <Block padding="m 0">
                    {accounts.map(({
                        address,
                        linkedPublicKey,
                    }, i) => (
                        <Block
                            key={+i}
                            padding="s 0"
                        >
                            <ListItem
                                profile={{
                                    type: 'user',
                                    address,
                                }}
                                content={(
                                    <HashText
                                        text={address}
                                        prefixLength={18}
                                        suffixLength={8}
                                    />
                                )}
                                size="xxs"
                                color={linkedPublicKey ? 'default' : 'red'}
                            />
                        </Block>
                    ))}
                </Block>
                <Block padding="m 0">
                    <Text
                        text={i18n.t('note.access.grant.explain')}
                        size="xs"
                        color="label"
                    />
                </Block>
            </Block>
        </PopupContent>
    );
};

NoteAccessConfirm.propTypes = {
    note: PropTypes.shape({
        noteHash: PropTypes.string.isRequired,
        value: PropTypes.number.isRequired,
    }).isRequired,
    asset: assetShape.isRequired,
    accounts: PropTypes.arrayOf(PropTypes.shape({
        address: PropTypes.string,
        linkedPublicKey: PropTypes.string,
    })).isRequired,
};

export default NoteAccessConfirm;
