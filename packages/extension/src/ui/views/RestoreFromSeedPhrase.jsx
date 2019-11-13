import React, {
    useState,
    useEffect,
} from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    TextInput,
    Text,
} from '@aztec/guacamole-ui';
import {
    errorShape,
} from '~/ui/config/propTypes';
import i18n from '~ui/helpers/i18n';
import formatAddress from '~ui/utils/formatAddress';
import PopupContent from '~ui/components/PopupContent';
import ProfileIcon from '~ui/components/ProfileIcon';

const RestoreFromSeedPhrase = ({
    address,
    seedPhrase,
    updateParentState,
    error,
}) => {
    const [inputRef, setInputRef] = useState(null);
    const [didMount, doMount] = useState(false);

    useEffect(() => {
        if (inputRef && !didMount) {
            inputRef.focus();
            doMount(true);
        }
    });

    return (
        <PopupContent
            theme="white"
            error={error}
        >
            <Block
                padding="l"
            >
                <Text text={i18n.t('account.restore.description')} size="s" />
            </Block>
            <Block
                top="l"
                bottom="l"
            >
                <ProfileIcon
                    type="user"
                    address={address}
                />
                <Block
                    top="m"
                    bottom="m"
                >
                    <Text
                        className="text-code"
                        text={formatAddress(address, 16, 10)}
                        size="xxs"
                    />
                </Block>
            </Block>
            <Block align="left">
                <TextInput
                    setInputRef={setInputRef}
                    type="textarea"
                    rows={3}
                    value={seedPhrase}
                    placeholder={i18n.t('account.restore.input.seedPhrase.placeholder')}
                    onChange={(val) => {
                        updateParentState({
                            seedPhrase: val,
                            error: null,
                        });
                    }}
                />
            </Block>
        </PopupContent>
    );
};

RestoreFromSeedPhrase.propTypes = {
    address: PropTypes.string.isRequired,
    seedPhrase: PropTypes.string,
    updateParentState: PropTypes.func.isRequired,
    error: errorShape,
};

RestoreFromSeedPhrase.defaultProps = {
    seedPhrase: '',
    error: null,
};

export default RestoreFromSeedPhrase;
