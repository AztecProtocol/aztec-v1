import React from 'react';
import PropTypes from 'prop-types';
import {
    Offset,
    Block,
    Text,
} from '@aztec/guacamole-ui';
import ListItem from '~/ui/components/ListItem';
import HashText from '~/ui/components/HashText';

const RecipientList = ({
    className,
    title,
    description,
    recipients,
}) => {
    const recipientNodes = (
        <Offset
            className={className}
            margin="xs 0"
        >
            {recipients.map(({
                address,
                footnote,
            }, i) => (
                <Block
                    key={+i}
                    padding="xs 0"
                >
                    <ListItem
                        profile={{
                            type: 'user',
                            address,
                        }}
                        content={(
                            <HashText
                                text={address}
                                color="label"
                                prefixLength={12}
                                suffixLength={4}
                                clickToCopy
                            />
                        )}
                        size="xxs"
                        footnote={footnote}
                    />
                </Block>
            ))}
        </Offset>
    );

    if (!title && !description) {
        return (
            <Block padding="s">
                {recipientNodes}
            </Block>
        );
    }

    return (
        <Block padding="xs 0">
            {!!title && (
                <Block padding="xs">
                    <Text
                        text={title}
                        color="label"
                        size="xxs"
                    />
                </Block>
            )}
            <Block padding="xs s">
                {recipientNodes}
            </Block>
            {!!description && (
                <Block padding="xs s">
                    <Text
                        text={description}
                        color="label"
                        size="xxs"
                    />
                </Block>
            )}
        </Block>
    );
};

RecipientList.propTypes = {
    className: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    recipients: PropTypes.arrayOf(PropTypes.shape({
        address: PropTypes.string.isRequired,
        footnote: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.node,
        ]),
    })).isRequired,
};

RecipientList.defaultProps = {
    className: '',
    title: '',
    description: '',
};

export default RecipientList;
