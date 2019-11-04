import urls from '~/config/urls';
import {
    backgroundReadyEvent,
} from '~/config/event';
import Iframe from '~/utils/Iframe';

class BackgroundFrame extends Iframe {
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
        super.open({
            width,
            height,
        });
    }

    close() {
        window.removeEventListener('resize', this.adjustFrameSize, true);
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
