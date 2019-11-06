import React from 'react';
import {
    Block,
    Text,
} from '@aztec/guacamole-ui';
import i18n from '~ui/helpers/i18n';
import PopupContent from '~ui/components/PopupContent';

const LinkAccount = () => (
    <PopupContent
        theme="white"
    >
        <Block>
            <Text text={i18n.t('register.linkAccount.blurb')} />
        </Block>

    </PopupContent>
);

LinkAccount.propTypes = {};

LinkAccount.defaultProps = {};

export default LinkAccount;
