const getIconTags = (tagName) => {
    const iconTags = [];
    const tags = document.head.getElementsByTagName(tagName);
    for (const tag of tags) { // eslint-disable-line no-restricted-syntax
        const rel = tag.getAttribute('rel');
        if (rel && rel.match(/icon/i)) {
            iconTags.push(tag);
        }
    }
    return iconTags;
};

export default function getSiteData() {
    const url = window.location.host;
    const titleTag = document.head.getElementsByTagName('title');

    const iconTags = [
        ...getIconTags('meta'),
        ...getIconTags('link'),
    ];

    const icons = [];
    iconTags.forEach((tag) => {
        const href = tag.getAttribute('href');
        if (!href.match(/\.[jpg|png|svg]/i)) return;

        const sizes = tag.getAttribute('sizes');
        const fullHref = href.startsWith('http')
            ? href
            : `${url}${href}`;
        icons.push({
            href: fullHref,
            sizes,
        });
    });

    return {
        title: titleTag.length ? titleTag[0].text : url,
        url,
        icons,
    };
}
