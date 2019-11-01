import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    Text,
} from '@aztec/guacamole-ui';
import i18n from '~ui/helpers/i18n';
import router from '~ui/helpers/router';
import formatAddress from '~ui/utils/formatAddress';
import PopupContent from '~ui/components/PopupContent';
import Connection from '~ui/components/Connection';

const DuplicatedAccount = ({
    address,
    goNext,
}) => (
    <PopupContent
        theme="white"
        title={i18n.t('account.duplicated.title')}
        description={i18n.t('account.duplicated.description')}
        submitButtonText={i18n.t('account.restore.fromSeedPhrase')}
        onSubmit={goNext}
        footerLink={{
            text: i18n.t('account.duplicated.clear'),
            href: router.u('account.clear'),
        }}
    >
        <Block bottom="xl">
            <Text
                className="text-code"
                text={formatAddress(address, 16, 10)}
                color="label"
                size="xxs"
            />
        </Block>
        <Connection
            theme="white"
            from={{
                profile: {
                    type: 'user',
                    address,
                },
            }}
            to={{
                profile: {
                    type: 'aztec',
                },
            }}
            actionIconName="warning"
            actionIconColor="red"
        />
    </PopupContent>
);

DuplicatedAccount.propTypes = {
    address: PropTypes.string.isRequired,
    goNext: PropTypes.func.isRequired,
};

export default DuplicatedAccount;
