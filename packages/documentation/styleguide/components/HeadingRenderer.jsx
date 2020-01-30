import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Styled from 'react-styleguidist/lib/client/rsg-components/Styled';
import {
  fontWeightMap,
} from '../../src/config/typography';

const styles = ({
  color,
  fontFamily,
  fontSize,
}) => ({
  heading: {
    margin: 0,
    color: '#1E1B2B',
    fontFamily: fontFamily.base,
    fontSize: fontSize.h2,
    fontWeight: fontWeightMap.light,
  },
  heading1: {
    fontSize: fontSize.h2,
    color: '#1E1B2B',
    fontWeight: fontWeightMap.light,
    margin: '8px 0px',
  },
  heading2: {
    fontSize: fontSize.h3,
    color: '#1E1B2B',
    fontWeight: fontWeightMap.light,
    margin: '8px 0px',
  },
  heading3: {
    fontSize: fontSize.h4,
    fontWeight: fontWeightMap.light,
    margin: '8px 0px',
  },
  heading4: {
    fontSize: fontSize.h5,
    fontWeight: fontWeightMap.light,
    margin: '8px 0px',
  },
  heading5: {
    fontSize: fontSize.h6,
    fontWeight: fontWeightMap.light,
    margin: '8px 0px',
  },
  heading6: {
    fontSize: fontSize.h6,
    fontWeight: fontWeightMap.light,
  },
});

function HeadingRenderer({
  classes,
  level,
  children,
  ...props
}) {
  const Tag = `h${level}`;
  const headingClasses = classnames(
    classes.heading,
    classes[`heading${level}`],
  );

  return (
    <Tag
      {...props}
      className={headingClasses}
    >
      {children}
    </Tag>
  );
}

HeadingRenderer.propTypes = {
  classes: PropTypes.object.isRequired,
  level: PropTypes.oneOf([1, 2, 3, 4, 5, 6]).isRequired,
  children: PropTypes.node,
};

HeadingRenderer.defaultProps = {
  children: null,
};

export default Styled(styles)(HeadingRenderer);
