import urls from '~/config/urls';
import {
    backgroundReadyEvent,
} from '~/config/event';
import Iframe from '~/utils/Iframe';

export default new Iframe({
    id: 'AZTECSDK',
    src: urls.background,
    onReadyEventName: backgroundReadyEvent,
    width: 340 + (16 * 2),
    height: 550 + (16 * 2),
    style: {
        position: 'fixed',
        right: '32px',
        bottom: '32px',
        zIndex: '99999',
    },
});
