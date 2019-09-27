import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    Text,
} from '@aztec/guacamole-ui';
import i18n from '~ui/helpers/i18n';
import router from '~ui/helpers/router';
import Popup from '~ui/components/Popup';

const Intro = ({
    goNext,
    goBack,
    onClose,
}) => {
    const descriptionNodes = [];
    for (let i = 0; i < 10; i += 1) {
        const textKey = `register.intro.description.para${i}`;
        if (!i18n.has(textKey)) break;

        descriptionNodes.push((
            <Block
                key={`para${i}`}
                padding="l 0"
            >
                <Text
                    text={i18n.t(textKey)}
                    size="xs"
                    color="label"
                    weight={i === 1 ? 'semibold' : 'normal'}
                />
            </Block>
        ));
    }

    return (
        <Popup
            theme="white"
            title={i18n.t('register.intro.title')}
            leftIconName={goBack ? 'chevron_left' : 'close'}
            onClickLeftIcon={goBack || onClose}
            submitButtonText={i18n.t('register.create.keys')}
            onSubmit={goNext}
            footerLink={{
                text: i18n.t('account.restore.fromSeedPhrase'),
                href: router.u('account.restore'),
            }}
        >
            {descriptionNodes}
        </Popup>
    );
};

Intro.propTypes = {
    goNext: PropTypes.func.isRequired,
    goBack: PropTypes.func,
    onClose: PropTypes.func,
};

Intro.defaultProps = {
    goBack: null,
    onClose: null,
};

export default Intro;
