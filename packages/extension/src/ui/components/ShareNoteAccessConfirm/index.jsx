import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    Text,
} from '@aztec/guacamole-ui';
import i18n from '~/ui/helpers/i18n';
import ListItem from '~/ui/components/ListItem';
import Separator from '~/ui/components/Separator';
import HashText from '~/ui/components/HashText';

const ShareNoteAccessConfirm = ({
    userAccessAccounts,
}) => (
    <Block padding="l 0">
        <Separator
            theme="white"
            title={i18n.t('note.access.share')}
        />
        <Block padding="m 0">
            {userAccessAccounts.map(({
                address,
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
                    />
                </Block>
            ))}
        </Block>
        <Block padding="m 0">
            <Text
                text={i18n.t('note.create.fromBalance.share.explain')}
                size="xs"
                color="label"
            />
        </Block>
    </Block>
);

ShareNoteAccessConfirm.propTypes = {
    userAccessAccounts: PropTypes.arrayOf(PropTypes.shape({
        address: PropTypes.string.isRequired,
    })).isRequired,
};

export default ShareNoteAccessConfirm;
