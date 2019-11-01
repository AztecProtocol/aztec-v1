import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    Text,
} from '@aztec/guacamole-ui';
import i18n from '~ui/helpers/i18n';
import router from '~ui/helpers/router';
import PopupContent from '~ui/components/PopupContent';
import Connection from '~ui/components/Connection';

const RestoreFailed = ({
    address,
    seedPhrase,
    isLinked,
    goNext,
}) => (
    <PopupContent
        theme="white"
        title={i18n.t('account.restore.failed.title')}
        description={i18n.t(`account.restore.failed${isLinked ? '.linked' : ''}.description`)}
        submitButtonText={i18n.t('account.restore.failed.retry')}
        onSubmit={goNext}
        footerLink={isLinked
            ? null
            : {
                text: i18n.t('account.create'),
                href: router.u('register'),
            }}
    >
        <Block bottom="xl">
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
        </Block>
        <Block
            padding="l"
            background="primary-lightest"
            borderRadius="m"
        >
            <Text size="xxs">
                {seedPhrase}
            </Text>
        </Block>
    </PopupContent>
);

RestoreFailed.propTypes = {
    address: PropTypes.string.isRequired,
    seedPhrase: PropTypes.string.isRequired,
    isLinked: PropTypes.bool.isRequired,
    goNext: PropTypes.func.isRequired,
};

export default RestoreFailed;
