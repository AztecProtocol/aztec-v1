import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    Text,
} from '@aztec/guacamole-ui';
import i18n from '~ui/helpers/i18n';
import Popup from '~ui/components/Popup';
import ClickToCopy from '~ui/components/ClickToCopy';

const BackupKeys = ({
    seedPhrase,
    goNext,
    goBack,
    onClose,
}) => (
    <Popup
        theme="white"
        title={i18n.t('register.backup.title')}
        description={i18n.t('register.backup.description')}
        leftIconName={goBack ? 'chevron_left' : 'close'}
        onClickLeftIcon={goBack || onClose}
        submitButtonText={i18n.t('register.backup.confirm')}
        onSubmit={goNext}
    >
        <ClickToCopy
            text={seedPhrase}
        >
            <Block
                padding="l"
                background="primary-lightest"
                borderRadius="m"
            >
                <Text size="xs">
                    {seedPhrase.split(' ').map((phrase, i) => (
                        <Block
                            key={`${+i}_${phrase}`}
                            padding="xxs 0"
                        >
                            {phrase}
                        </Block>
                    ))}
                </Text>
            </Block>
        </ClickToCopy>
    </Popup>
);

BackupKeys.propTypes = {
    seedPhrase: PropTypes.string.isRequired,
    goNext: PropTypes.func.isRequired,
    goBack: PropTypes.func,
    onClose: PropTypes.func,
};

BackupKeys.defaultProps = {
    goBack: null,
    onClose: null,
};

export default BackupKeys;
