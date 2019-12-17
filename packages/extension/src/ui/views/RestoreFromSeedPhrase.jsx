import React, {
    useState,
    useEffect,
} from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    TextInput,
} from '@aztec/guacamole-ui';
import {
    errorShape,
} from '~/ui/config/propTypes';
import i18n from '~/ui/helpers/i18n';
import PopupContent from '~/ui/components/PopupContent';
import ProfileIcon from '~/ui/components/ProfileIcon';
import HashText from '~/ui/components/HashText';

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
            descriptionKey="account.restore.description"
            error={error}
        >
            <Block
                padding="l 0"
            >
                <ProfileIcon
                    type="user"
                    address={address}
                />
                <Block
                    padding="m 0"
                >
                    <HashText
                        text={address}
                        prefixLength={18}
                        suffixLength={6}
                        color="label"
                        size="xs"
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
