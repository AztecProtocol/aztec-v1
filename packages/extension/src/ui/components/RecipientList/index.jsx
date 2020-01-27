import React from 'react';
import PropTypes from 'prop-types';
import {
    Offset,
    Block,
} from '@aztec/guacamole-ui';
import ListItem from '~/ui/components/ListItem';
import HashText from '~/ui/components/HashText';

const RecipientList = ({
    className,
    recipients,
}) => (
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

RecipientList.propTypes = {
    className: PropTypes.string,
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
};

export default RecipientList;
