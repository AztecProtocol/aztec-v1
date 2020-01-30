import React from 'react';
import PropTypes from 'prop-types';
import cx from 'clsx';
import Styled from 'react-styleguidist/lib/client/rsg-components/Styled';

const styles = ({
  color,
}) => ({
  link: {
    fontWeight: 300,
    '&, &:link, &:visited': {
      fontSize: 'inherit',
      color: 'inherit',
      fontFamily: 'Gill Sans',
      textDecoration: 'none',
    },
    '&:hover, &:active': {
      isolate: false,
      opacity: 0.7,
      cursor: 'pointer',
    },
  },
});

export function LinkRenderer({
  classes, children, ...props
}) {
  return (
    <a {...props} className={cx(classes.link, props.className)}>
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
