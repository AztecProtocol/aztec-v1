import React from 'react';
import PropTypes from 'prop-types';
import {
    FlexBox,
    Block,
    Text,
    Icon,
    Image,
    Clickable,
} from '@aztec/guacamole-ui';
import ConnectionService from '~/ui/services/ConnectionService';
import getDomainFromUrl from '~/utils/getDomainFromUrl';
import {
    siteShape,
} from '~/ui/config/propTypes';
import findOptimalIcon from '~/ui/utils/findOptimalIcon';
import styles from './popup.scss';

const Header = ({
    site,
    disableClose,
}) => {
    const {
        title,
        url,
        icons,
    } = site;
    const icon = findOptimalIcon(icons, { width: 80, height: 80 });
    const domain = getDomainFromUrl(url);

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
                            backgroundUrl={icon.href}
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
                            text={domain}
                            size="xxs"
                            color="primary-lighter"
                            showEllipsis
                        />
                    </div>
                </Block>
            </FlexBox>
            {!disableClose && (
                <div className="flex-fixed">
                    <Clickable
                        onClick={() => ConnectionService.close({
                            abort: true,
                        })}
                    >
                        <Icon
                            name="close"
                            size="xl"
                            color="label"
                        />
                    </Clickable>
                </div>
            )}
        </FlexBox>
    );
};

Header.propTypes = {
    site: siteShape.isRequired,
    disableClose: PropTypes.bool,
};

Header.defaultProps = {
    disableClose: false,
};

export default Header;
