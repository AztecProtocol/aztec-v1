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
    color: color.base,
    fontFamily: fontFamily.base,
    fontWeight: fontWeightMap.normal,
  },
  heading1: {
    fontSize: fontSize.h1,
    fontWeight: fontWeightMap.light,
  },
  heading2: {
    fontSize: fontSize.h2,
    fontWeight: fontWeightMap.light,
  },
  heading3: {
    fontSize: fontSize.h3,
    fontWeight: fontWeightMap.normal,
  },
  heading4: {
    fontSize: fontSize.h4,
    fontWeight: fontWeightMap.normal,
  },
  heading5: {
    fontSize: fontSize.h5,
    fontWeight: fontWeightMap.semibold,
  },
  heading6: {
    fontSize: fontSize.h6,
    fontWeight: fontWeightMap.bold,
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
