import {
    warnLog,
} from '~/utils/log';

const isFullUrl = url => url.match(/^(http(s)?|mailto):/);

const translate = (url, options) => {
    if (!options) {
        return url;
    }

    let translated = url;
    Object.keys(options).forEach((key) => {
        translated = translated.replace(new RegExp(`%{${key}}`, 'gi'), options[key]);
    });

    return translated;
};

class Router {
    constructor() {
        this.urls = {};
    }

    reset() {
        this.urls = {};
    }

    register(urls, prefix = '') {
        if (!urls || (typeof urls !== 'object')) return false;

        Object.keys(urls).forEach((key) => {
            const value = urls[key];
            if (typeof value !== 'string') {
                this.extend(value, {
                    name: key,
                    prefix,
                });
            } else if (isFullUrl(value)) {
                this.urls[key] = value;
            } else {
                const url = value ? `/${prefix}/${value}` : `/${prefix}`;
                this.urls[key] = url.replace(/\/{2,}/g, '/');
            }
        });

        return true;
    }

    extend(children, parent) {
        const urls = {};
        let {
            prefix,
        } = parent || {};
        Object.keys(children).forEach((name) => {
            if (name === '_') {
                prefix = prefix ? `${prefix}/${children._}` : children._;
            }

            const key = (name === '_') ? parent.name : `${parent.name}.${name}`;
            const value = children[name];
            let url;
            if (typeof value !== 'string') {
                url = value;
            } else if (name === '_') {
                url = '';
            } else if (isFullUrl(value)) {
                url = value;
            } else {
                url = parent.url ? `${parent.url}/${value}` : value;
            }
            urls[key] = url;
        });

        this.register(urls, prefix);
    }

    has(key) {
        return (key in this.urls);
    }

    u(key, options) {
        if (key === '/') {
            return key;
        }

        if (!this.has(key)) {
            warnLog(`Missing url for key: "${key}"`);
            return '/';
        }

        return translate(this.urls[key], options);
    }
}

export default new Router();
