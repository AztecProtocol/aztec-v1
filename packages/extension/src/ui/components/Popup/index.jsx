import React, {
    useContext,
} from 'react';
import PropTypes from 'prop-types';
import {
    FlexBox,
    Block,
} from '@aztec/guacamole-ui';
import {
    siteShape,
} from '~/ui/config/propTypes';
import ThemeContext from '~ui/views/handlers/ThemeContext';
import Header from './Header';
import styles from './popup.scss';

const Popup = ({
    site,
    children,
}) => {
    const theme = useContext(ThemeContext);

    return (
        <Block
            className={styles[`popup-${theme.name}`]}
            align="center"
        >
            <FlexBox
                direction="column"
                nowrap
                stretch
            >
                <Block
                    className={`flex-fixed ${styles.header}`}
                    padding="l xl"
                >
                    <Header
                        theme={theme.name}
                        site={site}
                    />
                </Block>
                <Block
                    className={`flex-free-expand ${styles.content}`}
                    stretch
                >
                    {children}
                </Block>
            </FlexBox>
        </Block>
    );
};

Popup.propTypes = {
    site: siteShape.isRequired,
    children: PropTypes.node,
};

Popup.defaultProps = {
    children: null,
};

export default Popup;
