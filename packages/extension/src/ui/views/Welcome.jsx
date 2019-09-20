import browser from 'webextension-polyfill';
import React from 'react';
import PropTypes from 'prop-types';
import {
    FlexBox,
    Block,
    Text,
    TextButton,
} from '@aztec/guacamole-ui';
import i18n from '~ui/helpers/i18n';
import {
    startUrl,
} from '~ui/config/settings';
import Popup from '~ui/components/Popup';
import Logo from '~ui/components/Logo';
import Button from '~ui/components/Button';

const Welcome = ({
    goToPage,
}) => (
    <Popup theme="primary">
        <FlexBox
            direction="column"
            align="center"
            valign="center"
            stretch
        >
            <Logo />
            <Block padding="xl 0">
                <Text
                    text={i18n.t('account.create.title')}
                    size="l"
                />
            </Block>
            <Block padding="m 0">
                <Text
                    text={i18n.t('account.create.description')}
                    size="s"
                />
            </Block>
            <Block padding="m 0">
                <Button
                    theme="white"
                    text={i18n.t('account.create')}
                    size="l"
                    onClick={() => {
                        if (window.location === startUrl) {
                            goToPage('register');
                        } else {
                            browser.tabs.create({ url: startUrl });
                        }
                    }}
                    outlined
                />
            </Block>
            <Block top="l">
                <Text
                    text={i18n.t('account.create.already')}
                    size="xxs"
                    color="white-light"
                />
                <Block top="xs">
                    <TextButton
                        theme="underline"
                        text={i18n.t('account.restore')}
                        color="white-light"
                        size="xxs"
                        onClick={() => goToPage('account.restore')}
                    />
                </Block>
            </Block>
        </FlexBox>
    </Popup>
);

Welcome.propTypes = {
    goToPage: PropTypes.func.isRequired,
};

export default Welcome;
