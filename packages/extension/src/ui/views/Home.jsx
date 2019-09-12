import React from 'react';
import {
    FlexBox,
    SVG,
} from '@aztec/guacamole-ui';
import Popup from '~ui/components/Popup';
import logoGlyph from '~ui/images/logo-white.svg';

const Home = () => (
    <Popup>
        <FlexBox
            valign="center"
            align="center"
            stretch
        >
            <SVG
                glyph={logoGlyph}
                width={150}
                height={42.5}
            />
        </FlexBox>
    </Popup>
);

export default Home;
