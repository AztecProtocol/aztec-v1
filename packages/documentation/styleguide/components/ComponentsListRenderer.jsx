import React, {
  useState,
} from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Styled from 'react-styleguidist/lib/client/rsg-components/Styled';
import Link from 'react-styleguidist/lib/client/rsg-components/Link';
import {
  getHash,
} from 'react-styleguidist/lib/client/utils/handleHash';
import {
  spacingMap,
  colorMap,
  roundedCornerMap,
} from '../../src/styles/guacamole-vars';
import sectionsConfig from '../config/sections';

const styles = () => ({
  root: {
    padding: [[0, spacingMap.m]],
    fontWeight: 400,
    fontSize: 16,
    color: 'white !important',
  },
  item: {
    padding: [[spacingMap.xs, spacingMap.xs]],
    fontWeight: 400,
    fontSize: 16,
    color: 'white !important',
  },
  label: {
    padding: [[spacingMap.xs, spacingMap.s]],
  },
  staticItem: {
    cursor: 'default',
  },
  staticButton: {
    '&:hover': {
      cursor: 'pointer',
      padding: [[spacingMap.xs, spacingMap.s]],
      background: colorMap['white-lightest'],
      borderRadius: roundedCornerMap.s,
    },
  },
  link: {
    color: 'white !important',
  },
  a: {
    color: 'white !important',
  },
  heading: {
    height: '100%',
  },
  selected: {
    fontWeight: 500,
    color: 'white !important',
  },
  child: {
    fontWeight: 300,
    fontSize: 14,
    color: 'white !important',
  },
});

export const ComponentsListRenderer = ({
  classes,
  items,
}) => {
  const visibleItems = items.filter(item => item.visibleName);

  const [isOpen, toggleOpen] = useState({});

  if (!visibleItems.length) {
    return null;
  }

  const windowHash = getHash(window.location.hash);
  return (
    <div
      className={classes.root}
    >
      {visibleItems.map(({
        name,
        heading,
        href,
        visibleName: defaultVisibleName,
        content,
        external,
        initialOpen,
      }) => {
        const {
          isStatic,
          disableToggle,
          visibleName,
        } = sectionsConfig[name] || {};
        const displayName = visibleName || defaultVisibleName;

        const isChild = !content || !content.props.items.length;
        const isItemSelected = `/#/${windowHash}` === href;
        const isAbleToToggle = !disableToggle && !!heading;
        const showContent = isOpen[defaultVisibleName]
          || disableToggle
          || (initialOpen && !(defaultVisibleName in isOpen));

        const handleClick = !isAbleToToggle
          ? null
          : () => toggleOpen({
            ...isOpen,
            [defaultVisibleName]: defaultVisibleName in isOpen
              ? !isOpen[defaultVisibleName]
              : !initialOpen,
          });

        const linkNode = isStatic
          ? (
            <div
              onClick={handleClick}
            >
              {displayName}
            </div>
          )
          : (
            <Link
              href={href}
              target={external ? '_blank' : undefined}
              onClick={handleClick}
            >
              {displayName}
            </Link>
          );

        return (
          <div
            key={href}
            className={classnames(
              classes.item,
              {
                [classes.heading]: heading,
                [classes.child]: isChild,
                [classes.selected]: isItemSelected,
              },
            )}
          >
            <div
              className={classnames(
                classes.label,
                {
                  [classes.staticButton]: isStatic && isAbleToToggle,
                  [classes.staticItem]: isStatic && !isAbleToToggle,
                },
              )}
            >
              {linkNode}
            </div>
            {showContent && content}
          </div>
        );
      })}
    </div>
  );
};

ComponentsListRenderer.propTypes = {
  classes: PropTypes.object.isRequired,
  items: PropTypes.array.isRequired,
};

export default Styled(styles)(ComponentsListRenderer);
