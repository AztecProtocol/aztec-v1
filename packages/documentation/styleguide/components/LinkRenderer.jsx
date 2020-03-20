import React from 'react';
import PropTypes from 'prop-types';
import cx from 'clsx';
import Styled from 'react-styleguidist/lib/client/rsg-components/Styled';

const styles = () => ({
    link: {
        '&, &:link, &:visited': {
            fontSize: 'inherit',
            color: 'inherit',
            fontFamily: 'Gill Sans',
            textDecoration: 'none',
            opacity: 0.85,
        },
        '&:hover, &:active': {
            isolate: false,
            opacity: 1,
            cursor: 'pointer',
        },
    },
});

export function LinkRenderer({ classes, children, ...props }) {
    const { className } = props;
    return (
        <a {...props} className={cx(classes.link, className)}>
            {children}
        </a>
    );
}

LinkRenderer.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    classes: PropTypes.object.isRequired,
};

export default Styled(styles)(LinkRenderer);
