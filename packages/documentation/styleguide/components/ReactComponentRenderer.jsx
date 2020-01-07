import React from 'react';
import PropTypes from 'prop-types';
import Pathline from 'react-styleguidist/lib/client/rsg-components/Pathline';
import Styled from 'react-styleguidist/lib/client/rsg-components/Styled';
import {
  spacingMap,
} from '../../src/config/layout';
import {
  fontSizeMap,
  fontWeightMap,
} from '../../src/config/typography';

const styles = () => ({
  root: {
    paddingTop: spacingMap.s,
    paddingBottom: spacingMap.xl,
  },
  heading: {
    paddingBottom: spacingMap.xl,
  },
  pathline: {
    paddingTop: spacingMap.s,
  },
  content: {
    fontSize: fontSizeMap.s,
    fontWeight: fontWeightMap.light,
    lineHeight: 1.5,
  },
  'tab-buttons': {
    padding: [[spacingMap.m, 0, spacingMap.xl]],
  },
  'tab-body': {
    paddingBottom: spacingMap.xxl,
  },
});

export const ReactComponentRenderer = ({
  classes,
  name,
  heading,
  pathLine,
  tabButtons,
  tabBody,
  description,
  docs,
  examples,
}) => (
  <div
    id={`${name}-container`}
    className={classes.root}
  >
    <div className={classes.heading}>
      {heading}
      {pathLine && (
        <div className={classes.pathline}>
          <Pathline>{pathLine}</Pathline>
        </div>
      )}
    </div>
    {tabButtons && (
      <div className={classes['tab-buttons']}>
        {tabButtons}
      </div>
    )}
    {tabBody && (
      <div className={classes['tab-body']}>
        {tabBody}
      </div>
    )}
    <div className={classes.content}>
      {description}
      {docs}
      {examples}
    </div>
  </div>
);

ReactComponentRenderer.propTypes = {
  classes: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  heading: PropTypes.node.isRequired,
  pathLine: PropTypes.string,
  tabButtons: PropTypes.node,
  tabBody: PropTypes.node,
  description: PropTypes.node,
  docs: PropTypes.node,
  examples: PropTypes.node,
};

ReactComponentRenderer.defaultProps = {
  pathLine: '',
  tabButtons: null,
  tabBody: null,
  description: null,
  docs: null,
  examples: null,
};

export default Styled(styles)(ReactComponentRenderer);
