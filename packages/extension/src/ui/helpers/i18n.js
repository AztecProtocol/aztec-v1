import I18n from '~utils/I18n';
import {
    warnLog,
} from '~utils/log';
import assets from '~ui/config/assets';

class UII18n extends I18n {
    asset(assetCode = '') {
        const code = assetCode.toLowerCase();
        if (this.has(code)) {
            return this.t(code);
        }

        const {
            name,
        } = assets[code] || {};
        if (!name) {
            warnLog(`Asset name is not defined for '${code}'.`);
        }

        return name || assetCode;
    }
}

export default new UII18n();
