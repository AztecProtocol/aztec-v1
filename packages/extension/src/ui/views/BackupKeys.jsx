import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    Text,
} from '@aztec/guacamole-ui';
import i18n from '~ui/helpers/i18n';
import PopupContent from '~ui/components/PopupContent';
import ClickToCopy from '~ui/components/ClickToCopy';

const BackupKeys = ({
    seedPhrase,
}) => (
    <PopupContent
        theme="white"
    >
        <Block
            padding="l"
            background="primary-lightest"
            borderRadius="m"
            className="flex-free-expand"
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
    </PopupContent>
);

BackupKeys.propTypes = {
    seedPhrase: PropTypes.string,
};

BackupKeys.defaultProps = {
    seedPhrase: '',
};

export default BackupKeys;
