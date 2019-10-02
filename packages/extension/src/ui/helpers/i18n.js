import I18n from '~utils/I18n';
import {
    warnLog,
} from '~utils/log';
import tokens from '~ui/config/tokens';

class UII18n extends I18n {
    token(tokenCode = '') {
        const code = tokenCode.toLowerCase();
        if (this.has(code)) {
            return this.t(code);
        }

        const {
            name,
        } = tokens[code] || {};
        if (!name) {
            warnLog(`Token name is not defined for '${code}'.`);
        }

        return name || tokenCode;
    }
}

export default new UII18n();
