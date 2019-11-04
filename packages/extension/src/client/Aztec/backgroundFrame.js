import urls from '~/config/urls';
import {
    backgroundReadyEvent,
} from '~/config/event';
import Iframe from '~/utils/Iframe';

class BackgroundFrame extends Iframe {
    constructor(...args) {
        super(...args);
        this.defaultStyle = window.document.body.style;
    }

    adjustFrameSize = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.updateStyle({
            width,
            height,
        });
    };

    open() {
        window.addEventListener('resize', this.adjustFrameSize, true);
        const width = window.innerWidth;
        const height = window.innerHeight;
        window.document.body.style.backgroundAttatchement = 'fixed';
        window.document.body.style.overflow = 'hidden';
        super.open({
            width,
            height,
        });
    }

    close() {
        window.removeEventListener('resize', this.adjustFrameSize, true);
        window.document.body.style = this.defaultStyle;
        super.close();
    }
}

export default new BackgroundFrame({
    id: 'AZTECSDK',
    src: urls.background,
    onReadyEventName: backgroundReadyEvent,
    width: '100vw',
    height: '100vh',
    style: {
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: '99999',
    },
});
