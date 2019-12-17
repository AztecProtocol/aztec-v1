import React, {
    useContext,
} from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
    FlexBox,
    Block,
} from '@aztec/guacamole-ui';
import {
    siteShape,
} from '~/ui/config/propTypes';
import ThemeContext from '~/ui/views/handlers/ThemeContext';
import Header from './Header';
import styles from './popup.scss';

const Popup = ({
    className,
    site,
    children,
    onClose,
}) => {
    const theme = useContext(ThemeContext);

    return (
        <Block
            className={classnames(className, styles[`popup-${theme.name}`])}
            align="center"
        >
            <FlexBox
                direction="column"
                nowrap
                stretch
            >
                {!!site && (
                    <Block
                        className={`flex-fixed ${styles.header}`}
                        padding="l xl"
                    >
                        <Header
                            theme={theme.name}
                            site={site}
                            onClose={onClose}
                        />
                    </Block>
                )}
                <Block
                    className={classnames(
                        'flex-free-expand',
                        styles.content,
                        {
                            [styles['no-header']]: !site,
                        },
                    )}
                    stretch
                >
                    {children}
                </Block>
            </FlexBox>
        </Block>
    );
};

Popup.propTypes = {
    className: PropTypes.string,
    site: siteShape,
    children: PropTypes.node,
    onClose: PropTypes.func,
};

Popup.defaultProps = {
    className: '',
    site: null,
    children: null,
    onClose: null,
};

export default Popup;
