import browser from 'webextension-polyfill';

export default function enableApi() {
    // TODO
    // - always inject a simple object for developer to use for permission check
    // - inject complete api if user has allowed webpage to access extension
    const s = document.createElement('script');
    s.src = browser.runtime.getURL('./build/bundle.client.js');
    document.body.appendChild(s);
}
