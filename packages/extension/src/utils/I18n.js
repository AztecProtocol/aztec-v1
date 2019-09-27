import Polyglot from 'node-polyglot';

const defaultLocale = 'en';

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
        const phrase = this.polyglot.t(phraseKey, options);

        return phrase;
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
