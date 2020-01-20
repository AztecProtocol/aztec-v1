import psl from 'psl';

export default function getDomainFromUrl(url) {
    const host = url
        .replace(/^https?:\/\//, '')
        .replace(/[/|?|:].*$/, '');
    let domain;
    if (host.match(/^[^/]{0,}(127.0.0.1|localhost)(:[0-9+]|\/)?/)) {
        domain = 'localhost';
    } else if (host.match(/^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/)) {
        domain = host;
    } else {
        ({
            domain,
        } = psl.parse(host));
    }

    return domain;
}
