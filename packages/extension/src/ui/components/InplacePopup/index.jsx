import React, {
    PureComponent,
} from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
    Block,
    Offset,
    TextButton,
    Icon,
    Clickable,
} from '@aztec/guacamole-ui';
import {
    themeType,
} from '~/ui/config/propTypes';
import i18n from '~/ui/helpers/i18n';
import styles from './popup.scss';

class InplacePopup extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            showAll: false,
            height: 0,
            width: 0,
        };

        this.holder = null;
    }

    setHolderRef = (ref) => {
        this.holder = ref;
    };

    togglePopup = () => {
        const {
            showAll,
            height: prevHeight,
            width: prevWidth,
        } = this.state;

        let height = prevHeight;
        let width = prevWidth;
        if (!height) {
            ({
                height,
                width,
            } = this.holder.getBoundingClientRect());
        }

        this.setState({
            showAll: !showAll,
            height,
            width,
        });
    };

    render() {
        const {
            className,
            theme,
            items,
            renderContent,
            renderItem,
            numberOfVisibleItems,
            margin,
            itemMargin,
        } = this.props;
        const {
            showAll,
            height,
            width,
        } = this.state;
        const numberOfItems = showAll ? items.length : numberOfVisibleItems;
        const hasMore = items.length > numberOfVisibleItems;

        const itemNodes = renderContent(items
            .slice(0, numberOfItems)
            .map((item, i) => (
                <Block key={+i} padding={itemMargin}>
                    {renderItem(item)}
                </Block>
            )));

        let scaleStyleRules = {};
        if (showAll) {
            const scaleRatio = !width
                ? 1
                : 1 + (2 / width);
            scaleStyleRules = {
                WebkitTransform: `scale(${scaleRatio})`,
                msTransform: `scale(${scaleRatio})`,
                transform: `scale(${scaleRatio})`,
            };
        }

        return (
            <Offset
                className={classnames(
                    className,
                    styles.offset,
                    {
                        [styles.expand]: showAll,
                    },
                )}
                margin={margin}
            >
                {hasMore && (
                    <Block
                        className={classnames(
                            styles.frame,
                            {
                                [styles.hide]: !showAll,
                            },
                        )}
                        borderRadius="xs"
                        layer={2}
                        style={{
                            ...scaleStyleRules,
                            height: `${height}px`,
                        }}
                    />
                )}
                <div
                    ref={this.setHolderRef}
                    className={styles.content}
                    style={{
                        ...scaleStyleRules,
                        height: showAll ? `${height}px` : 'auto',
                    }}
                >
                    <Block padding={margin}>
                        {itemNodes}
                        {hasMore && (
                            <Block
                                className={classnames(
                                    styles.button,
                                    {
                                        hide: showAll,
                                    },
                                )}
                                padding={itemMargin}
                            >
                                <TextButton
                                    text={i18n.t('show.more.count', items.length - numberOfVisibleItems)}
                                    size="xxs"
                                    color={theme === 'white' ? 'primary' : 'white-light'}
                                    onClick={this.togglePopup}
                                />
                            </Block>
                        )}
                    </Block>
                </div>
                {hasMore && (
                    <Clickable
                        className={classnames(
                            styles.closeButton,
                            styles.button,
                            {
                                [styles.hide]: !showAll,
                            },
                        )}
                        onClick={this.togglePopup}
                        inline
                    >
                        <Block
                            padding="xs"
                            borderRadius="circular"
                            background={theme === 'white' ? 'white' : 'grey'}
                            hasBorder={theme === 'white'}
                            layer={2}
                        >
                            <Icon
                                name="close"
                                color={theme === 'white' ? 'label' : 'white-light'}
                            />
                        </Block>
                    </Clickable>
                )}
            </Offset>
        );
    }
}

InplacePopup.propTypes = {
    className: PropTypes.string,
    theme: themeType,
    items: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
    renderItem: PropTypes.func.isRequired,
    renderContent: PropTypes.func,
    numberOfVisibleItems: PropTypes.number,
    margin: PropTypes.string,
    itemMargin: PropTypes.string,
};

InplacePopup.defaultProps = {
    className: '',
    theme: 'primary',
    renderContent: c => c,
    numberOfVisibleItems: 2,
    margin: 'xs m',
    itemMargin: 'xs 0',
};

export default InplacePopup;
