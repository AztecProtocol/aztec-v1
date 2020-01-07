import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Styled from 'react-styleguidist/lib/client/rsg-components/Styled';
import {
  defaultTextColor,
} from '../../src/config/colors';
import {
  fontSizeMap,
} from '../../src/config/typography';
import {
  spacingMap,
} from '../../src/config/layout';

const styles = () => ({
  heading: {
    display: 'flex',
  },
  'level-1': {
    fontSize: fontSizeMap.xxl,
    padding: [[spacingMap.xxl, 0]],
    fontFamily: 'Gill Sans',
  },
  'level-2': {
    fontSize: fontSizeMap.xl,
    paddingTop: spacingMap.xxl,
    fontFamily: 'Gill Sans',
  },
  'level-3': {
    fontSize: fontSizeMap.l,
    fontFamily: 'Gill Sans',
  },
  'level-4': {
    fontSize: fontSizeMap.m,
    fontFamily: 'Gill Sans',
  },
  'level-5': {
    fontSize: fontSizeMap.m,
    fontFamily: 'Gill Sans',
  },
  'level-6': {
    fontSize: fontSizeMap.s,
    fontFamily: 'Gill Sans',
  },
  title: {
    flex: '1 1 auto',
    lineHeight: 1,
  },
  link: {
    color: defaultTextColor,
  },
  toolbar: {
    'flex-shrink': 0,
  },
});

export const SectionHeadingRenderer = ({
  classes,
  id,
  href,
  depth,
  children,
  toolbar,
  deprecated,
}) => {
  const headingLevel = Math.min(6, depth);
  return (
    <div
      id={id}
      className={`${classes.heading}
      ${classes[`level-${headingLevel}`]}`}
    >
      <div className={classes.title}>
        <a
          href={href}
          className={classnames(classes.link, {
            [classes.deprecated]: deprecated,
          })}
        >
          {children}
        </a>
      </div>
      {toolbar && (
        <div className={classes.toolbar}>
          {toolbar}
        </div>
      )}
    </div>
  );
};

SectionHeadingRenderer.propTypes = {
  classes: PropTypes.object.isRequired,
  children: PropTypes.node,
  toolbar: PropTypes.node,
  id: PropTypes.string.isRequired,
  href: PropTypes.string.isRequired,
  depth: PropTypes.number.isRequired,
  deprecated: PropTypes.bool,
};

SectionHeadingRenderer.defaultProps = {
  children: null,
  toolbar: null,
  deprecated: false,
};

export default Styled(styles)(SectionHeadingRenderer);
