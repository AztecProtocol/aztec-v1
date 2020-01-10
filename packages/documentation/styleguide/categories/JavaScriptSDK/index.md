```js

const loadSdk = async () => {


  let script = window.document.createElement('script');
  script.type = 'text/javascript';
  script.async = true;
  script.src = 'https://sdk.aztecprotocol.com/aztec.js';
  const scriptLoaded = new Promise((resolve)=>{
      script.onload = resolve;
      });
  document.getElementsByTagName('head')[0].appendChild(script);

  await scriptLoaded;


}

await loadSdk();
await window.aztec.enable({
  apiKey: 'ethglobalstarterkit'
});
```
