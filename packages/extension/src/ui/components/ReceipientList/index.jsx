import React from 'react';
import PropTypes from 'prop-types';
import {
    Offset,
    Block,
} from '@aztec/guacamole-ui';
import ListItem from '~/ui/components/ListItem';
import HashText from '~/ui/components/HashText';

const ReceipientList = ({
    className,
    receipients,
}) => (
    <Offset
        className={className}
        margin="xs 0"
    >
        {receipients.map(({
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

ReceipientList.propTypes = {
    className: PropTypes.string,
    receipients: PropTypes.arrayOf(PropTypes.shape({
        address: PropTypes.string.isRequired,
        footnote: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.node,
        ]),
    })).isRequired,
};

ReceipientList.defaultProps = {
    className: '',
};

export default ReceipientList;
