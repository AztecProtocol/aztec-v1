import React from 'react';
import PropTypes from 'prop-types';
import {
    FlexBox,
    Block,
    Text,
    SVG,
    Image,
    Clickable,
} from '@aztec/guacamole-ui';
import {
    siteShape,
} from '~/ui/config/propTypes';
import findOptimalIcon from '~/ui/utils/findOptimalIcon';
import closeGlyph from '~/ui/images/close.svg';
import styles from './popup.scss';

const Header = ({
    site,
    onClose,
}) => {
    const {
        title,
        domain,
        icons,
    } = site;
    const icon = findOptimalIcon(icons, { width: 80, height: 80 });

    return (
        <FlexBox
            valign="center"
        >
            <FlexBox
                className={`flex-free-expand ${styles.site}`}
                valign="center"
                nowrap
            >
                {!!icon && (
                    <Block
                        className="flex-fixed"
                        right="m"
                    >
                        <Image
                            className={styles['site-icon']}
                            ratio="square"
                            backgroundUrl={icon.href}
                            borderRadius="s"
                        />
                    </Block>
                )}
                <Block
                    className={styles['site-info']}
                    align="left"
                    right="m"
                >
                    <Text
                        text={title}
                        size="xs"
                        showEllipsis
                    />
                    <div>
                        <Text
                            className={styles['site-url']}
                            text={domain}
                            color="primary-lighter"
                            showEllipsis
                        />
                    </div>
                </Block>
            </FlexBox>
            {!!onClose && (
                <div className="flex-fixed">
                    <Clickable
                        className={styles['close-button']}
                        onClick={onClose}
                    >
                        <SVG
                            glyph={closeGlyph}
                            color="grey"
                            width="100%"
                            height="100%"
                        />
                    </Clickable>
                </div>
            )}
        </FlexBox>
    );
};

Header.propTypes = {
    site: siteShape.isRequired,
    onClose: PropTypes.func,
};

Header.defaultProps = {
    onClose: null,
};

export default Header;
