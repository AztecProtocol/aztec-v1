import React from 'react';
import PropTypes from 'prop-types';
import Link from 'react-styleguidist/lib/client/rsg-components/Link';
import Styled from 'react-styleguidist/lib/client/rsg-components/Styled';
import { colorMap } from '../../src/config/colors';

const styles = ({ fontFamily, space }) => ({
    logo: {
        display: 'flex',
        alignItems: 'center',
        margin: 0,
        fontFamily: fontFamily.base,
        fontSize: 18,
        fontWeight: 'normal',
        paddingTop: space[1],
        paddingLeft: space[2],
        paddingRight: space[2],
    },
    link: {
        color: `${colorMap.white} !important`,
    },
});

export function LogoRenderer({ classes, children }) {
    return (
        <h1 className={classes.logo}>
            <Link className={classes.link} href="/">
                {children}
            </Link>
        </h1>
    );
}

LogoRenderer.propTypes = {
    classes: PropTypes.object.isRequired,
    children: PropTypes.node.isRequired,
};

export default Styled(styles)(LogoRenderer);
