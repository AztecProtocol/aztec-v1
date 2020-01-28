import React from 'react';
import PropTypes from 'prop-types';
import {
    FlexBox,
    Block,
} from '@aztec/guacamole-ui';
import UiPlaceholder from '~/ui/views/UiPlaceholder';
import BrowserWindow from './BrowserWindow';
import Panel from './Panel';
import styles from './panel.scss';

const ControlPanel = ({
    children,
}) => (
    <FlexBox
        nowrap
        stretch
    >
        <Block
            className={styles['section-extension']}
            background="grey-darker"
            padding="xxl"
            stretch
        >
            <BrowserWindow
                className={styles['browser-window']}
            >
                <div id="background-app">
                    <UiPlaceholder initialVisibility>
                        <div id="aztec-popup-ui-app">
                            {children}
                        </div>
                    </UiPlaceholder>
                </div>
            </BrowserWindow>
        </Block>
        <Block
            className={styles['section-panel']}
            background="grey-lightest"
            stretch
        >
            <Panel />
        </Block>
    </FlexBox>
);

ControlPanel.propTypes = {
    children: PropTypes.node.isRequired,
};

export default ControlPanel;
