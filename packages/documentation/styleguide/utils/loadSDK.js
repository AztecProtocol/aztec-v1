async function loadSDK(sdkSource = 'https://sdk.aztecprotocol.com/aztec.js') {
    const script = window.document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = sdkSource;

    const scriptLoaded = new Promise((resolve) => {
        script.onload = resolve;
    });

    document.getElementsByTagName('head')[0].appendChild(script);
    await scriptLoaded;
}

export default loadSDK;
