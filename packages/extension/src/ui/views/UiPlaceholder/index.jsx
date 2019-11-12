import React, {
    useState,
} from 'react';
import PropTypes from 'prop-types';
import posed, { PoseGroup } from 'react-pose';
import ThemeContext from '~ui/views/handlers/ThemeContext';
import Loading from '~/ui/views/Loading';
import Popup from '~/ui/components/Popup';
import PoweredBy from '~/ui/components/PoweredBy';
import styles from './placeholder.scss';

const Overlay = posed.div({
    enter: {
        opacity: 1,
        delay: 300,
    },
    exit: {
        opacity: 0,
        transition: { duration: 400 },
    },
});

const UiPlaceholder = ({
    children,
    initialVisibility,
}) => {
    const [visible, toggle] = useState(initialVisibility);
    const [renderOverlay, updateOverlay] = useState(initialVisibility);
    const [setListener, updateSetListener] = useState(initialVisibility);
    const [renderPopup, updatePopup] = useState(initialVisibility);

    if (!setListener) {
        window.addEventListener('openAztec', () => {
            toggle(true);
            setTimeout(() => updateOverlay(true));
            setTimeout(() => updatePopup(true), 400);
        });
        window.addEventListener('closeAztec', () => {
            toggle(false);
            updateOverlay(false);
            updatePopup(false);
        });
        updateSetListener(true);
    }


    return (
        <div id="aztec-popup-container">
            <PoseGroup>
                {renderOverlay && visible && (
                    <Overlay
                        key="overlay"
                        className="aztec-overlay"
                    />
                )}
            </PoseGroup>
            <div
                key="content"
                className={renderPopup && visible
                    ? 'aztec-popup shown'
                    : 'aztec-popup'}
            >
                <div id="aztec-popup-ui">
                    {children}
                </div>
                <div id="aztec-popup-placeholder">
                    <Popup>
                        <Loading />
                    </Popup>
                </div>
                <ThemeContext.Consumer>
                    {theme => (
                        <PoweredBy
                            className={styles.footer}
                            theme={theme.name}
                        />
                    )}
                </ThemeContext.Consumer>
            </div>


        </div>
    );
};


UiPlaceholder.propTypes = {
    children: PropTypes.node,
    initialVisibility: PropTypes.bool,
};

UiPlaceholder.defaultProps = {
    children: null,
    initialVisibility: false,
};

export default UiPlaceholder;
