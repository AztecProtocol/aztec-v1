import Polyglot from 'node-polyglot';
import {
    simplePluralize,
    capitalize,
} from '~/utils/format';

const defaultLocale = 'en';

const isReactElement = type => type
    && typeof type === 'object'
    && !!type.$$typeof;

export default class I18n {
    constructor(options = { locale: defaultLocale }) {
        this.polyglot = new Polyglot(options);
        this.locale = options.locale;
        this.locales = {};
    }

    getLocale() {
        return this.locale;
    }

    setLocale(locale) {
        if (locale && locale !== this.locale) {
            this.switchLocale(locale);
        }

        return this.locale;
    }

    switchLocale(locale) {
        this.locales[this.locale] = { ...this.polyglot.phrases };
        this.locale = locale;
        this.polyglot.clear();
        this.polyglot.locale(locale);
        if (locale in this.locales) {
            this.polyglot.extend(this.locales[locale]);
        }
    }

    register(phrases) {
        if (!phrases) return;

        this.polyglot.extend(phrases);
    }

    flush(locale) {
        if (!locale) {
            this.locales = {};
        } else if (locale in this.locales) {
            this.locales[locale] = {};
        }
    }

    has(key) {
        return this.polyglot.has(`${key}._`) || this.polyglot.has(key);
    }

    t(key, options = {}) {
        let phraseKey;
        const count = typeof options !== 'object'
            ? options
            : options.count;
        if (typeof count === 'number'
            && this.polyglot.has(`${key}.${count}`)
        ) {
            phraseKey = `${key}.${count}`;
        }
        if (!phraseKey) {
            phraseKey = this.polyglot.has(`${key}._`) ? `${key}._` : key;
        }

        let phraseOptions = options;
        const hasReactNode = typeof options === 'object'
            && Object.values(options).some(isReactElement);
        if (hasReactNode) {
            phraseOptions = {};
            Object.keys(options).forEach((optKey) => {
                phraseOptions[key] = `%{${optKey}}`;
            });
        }
        let phrase = this.polyglot.t(phraseKey, phraseOptions);
        if (hasReactNode) {
            const phraseStr = phrase;
            phrase = [];
            let start = 0;
            phraseStr.replace(/%{([^%{]+)}/g, (optVar, optKey, pos) => {
                if (!(optKey in options)) {
                    return optVar;
                }
                const optVal = options[optKey];
                const prefix = phraseStr.substring(start, pos);
                const addStr = (str) => {
                    const insertAt = typeof phrase[phrase.length - 1] === 'string'
                        ? phrase.length - 1
                        : phrase.length;
                    phrase[insertAt] = `${phrase[insertAt] || ''}${prefix}${str}`;
                };
                if (isReactElement(optVal)) {
                    if (pos !== start) {
                        addStr('');
                    }
                    phrase.push(optVal);
                } else {
                    addStr(optVal);
                }
                start = pos + optVar.length;
                return options[optKey];
            });
            if (start < phraseStr.length) {
                phrase.push(phraseStr.substr(start));
            }
        }

        return phrase;
    }

    singular(key) {
        return this.t(key, 1);
    }

    plural(key) {
        if (this.has(`${key}.1`)) {
            return this.t(`${key}._`);
        }

        const phrase = this.singular(key);
        return simplePluralize(phrase || key);
    }

    count(key, count, capitalized = false) {
        let phrase = parseInt(count, 10) === 1
            ? this.singular(key)
            : this.plural(key);
        if (capitalized) {
            phrase = capitalize(phrase);
        }
        return `${count} ${phrase}`;
    }

    ordinal(number) {
        const locale = this.getLocale();
        switch (locale) {
            case 'en': {
                const s = ['th', 'st', 'nd', 'rd'];
                const tens = number % 100;
                const suffix = (s[(tens - 20) % 10])
                    || s[tens]
                    || s[0];
                return `${number}${suffix}`;
            }
            default:
                return `${number}`;
        }
    }
}
