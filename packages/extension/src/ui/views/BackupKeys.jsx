import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    Text,
} from '@aztec/guacamole-ui';
import PopupContent from '~/ui/components/PopupContent';

const BackupKeys = ({
    seedPhrase,
}) => (
    <PopupContent>
        <Block
            padding="l"
            background="white-lighter"
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
    seedPhrase: PropTypes.string.isRequired,
};

export default BackupKeys;
