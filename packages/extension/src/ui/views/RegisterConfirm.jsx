import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    Text,
} from '@aztec/guacamole-ui';
import i18n from '~ui/helpers/i18n';
import ListItem from '~ui/components/ListItem';
import formatAddress from '~ui/utils/formatAddress';
import PopupContent from '~ui/components/PopupContent';

const RegisterConfirm = ({ address, linkedPublicKey }) => (
    <PopupContent
        theme="white"
    >
        <Block bottom="l">
            <Text
                text={i18n.t('register.confirm.blurb')}
                weight="light"
            />
        </Block>
        <Block padding="m" align="center">
            <ListItem
                profile={{
                    type: 'user',
                    address,
                }}
                content={formatAddress(address, 10, 8)}
                size="xs"
            />
            <ListItem
                profile={{
                    type: 'user',
                    address,
                }}
                content={formatAddress(linkedPublicKey, 10, 8)}
                size="xs"
            />
        </Block>

    </PopupContent>
);

RegisterConfirm.propTypes = {
    address: PropTypes.string.isRequired,
    linkedPublicKey: PropTypes.string.isRequired,
};


export default RegisterConfirm;
