import React from 'react';
import ReactDOM from 'react-dom';
import i18n from '~ui/helpers/i18n';
import Popup from '~/ui/components/Popup';
import Loading from '~/ui/views/Loading';
import PoweredBy from '~/ui/components/PoweredBy';
import './styles/guacamole.css';
import styles from './styles/background.scss';

const UiPlaceholder = () => {
    const locale = 'en';
    const theme = {
        name: 'light',
    };
    const phrases = require(`./locales/${locale}`).default; // eslint-disable-line global-require, import/no-dynamic-require
    i18n.setLocale(locale);
    i18n.register(phrases);

    return (
        <div
            id="aztec-popup"
            className={styles['ui-placeholder']}
        >
            <div id="aztec-popup-ui" />
            <div id="aztec-popup-placeholder">
                <Popup>
                    <Loading />
                </Popup>
            </div>
            <PoweredBy
                className={styles.footer}
                theme={theme.name}
            />
        </div>
    );
};

ReactDOM.render(
    <UiPlaceholder />,
    document.getElementById('background-app'),
);
