export default function getAbsoluteIconUrl(href, location = window.location) {
    if (href.startsWith('http')) {
        return href;
    }

    const {
        origin,
        pathname,
    } = location;
    const paths = pathname.split('/').filter(p => p);
    let relHref = href.replace(/^(\.)?\//, '');
    while (relHref && relHref.startsWith('..')) {
        relHref = relHref.replace(/^..\//, '');
        paths.pop();
    }

    const relativePath = paths.length
        ? `${paths.join('/')}/`
        : '';
    return `${origin}/${relativePath}${relHref}`;
}
