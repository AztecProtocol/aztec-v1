import React from 'react';
import ReactDOM from 'react-dom';
import i18n from '~/ui/helpers/i18n';
import UiPlaceholder from '~/ui/views/UiPlaceholder';
import './styles/guacamole.css';
import './styles/background.scss';

const locale = 'en';
const phrases = require(`./locales/${locale}`).default; // eslint-disable-line global-require, import/no-dynamic-require
i18n.setLocale(locale);
i18n.register(phrases);

ReactDOM.render(
    <UiPlaceholder />,
    document.getElementById('background-app'),
);
