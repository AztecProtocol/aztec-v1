import React from 'react';
import {
    FlexBox,
    Block,
    Text,
    Icon,
    Image,
} from '@aztec/guacamole-ui';
import {
    siteShape,
} from '~/ui/config/propTypes';
import findOptimalIcon from '~/ui/utils/findOptimalIcon';
import styles from './popup.scss';

const Header = ({
    site,
}) => {
    const {
        title,
        url,
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
                        right="s"
                    >
                        <Image
                            className={styles['site-icon']}
                            ratio="square"
                            backgroundUrl={`${url}${icon.href}`}
                            borderRadius="s"
                        />
                    </Block>
                )}
                <Block
                    className={styles['site-info']}
                    align="left"
                    right="s"
                >
                    <Text
                        text={title}
                        size="xs"
                        weight="light"
                        showEllipsis
                    />
                    <div>
                        <Text
                            text={url}
                            size="xxs"
                            color="primary-lighter"
                            showEllipsis
                        />
                    </div>
                </Block>
            </FlexBox>
            <div className="flex-fixed">
                <Icon
                    name="close"
                    size="xl"
                    color="label"
                />
            </div>
        </FlexBox>
    );
};

Header.propTypes = {
    site: siteShape.isRequired,
};

export default Header;
