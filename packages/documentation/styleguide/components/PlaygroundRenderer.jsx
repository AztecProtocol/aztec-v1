import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Styled from 'react-styleguidist/lib/client/rsg-components/Styled';

export const styles = ({
  space,
}) => ({
  root: {
    padding: [[space[3], 0, 64]],
  },
  preview: {
    padding: space[2],
    backgroundImage: 'linear-gradient(rgba(246,247,248,0.5) 4px, rgba(255,255,255,0) 4px)',
    backgroundSize: '8px 8px',
    // the next 2 lines are required to contain floated components
    width: '100%',
    display: 'inline-block',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    margin: [[space[1], 0]],
  },
  toolbar: {
    marginLeft: 'auto',
  },
  tab: {}, // expose className to allow using it in 'styles' settings
});

export function PlaygroundRenderer({
  classes,
  name,
  preview,
  previewProps,
  tabButtons,
  tabBody,
  toolbar,
}) {
  const {
    className,
    ...props
  } = previewProps;

  return (
    <div className={classes.root}>
      <div
        data-preview={name}
      >
        {preview}
      </div>
      <div className={classes.controls}>
        <div className={classes.toolbar}>{toolbar}</div>
      </div>
      <div className={classes.tab}>{tabBody}</div>
    </div>
  );
}

PlaygroundRenderer.propTypes = {
  classes: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  preview: PropTypes.node.isRequired,
  previewProps: PropTypes.object.isRequired,
  tabButtons: PropTypes.node.isRequired,
  tabBody: PropTypes.node.isRequired,
  toolbar: PropTypes.node.isRequired,
};

export default Styled(styles)(PlaygroundRenderer);
