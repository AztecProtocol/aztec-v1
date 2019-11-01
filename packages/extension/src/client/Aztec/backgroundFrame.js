import urls from '~/config/urls';
import {
    backgroundReadyEvent,
} from '~/config/event';
import Iframe from '~/utils/Iframe';

export default new Iframe({
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
