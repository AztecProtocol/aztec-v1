import browser from 'webextension-polyfill';

export default function enableApi() {
    // TODO
    // - always inject a simple object for developer to use for permission check
    // - inject complete api if user has allowed webpage to access extension
    const d = document.createElement('iframe');
    d.src = browser.runtime.getURL('./pages/iframe.html');
    d.style.display = 'none';
    d.id = 'AZTECSDK';
    d.height = 0;
    d.width = 0;
    d.style.position = 'fixed';
    d.style.right = '32px';
    d.style.bottom = '32px';
    d.style.zIndex = '9999';
    document.body.appendChild(d);

    const s = document.createElement('script');
    s.src = browser.runtime.getURL('./build/bundle.client.js');
    document.body.appendChild(s);
}
