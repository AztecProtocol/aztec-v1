Deposit ERC20 tokens into an AZTEC ZkAsset:

```jsx
import Demo from '../../../src/components/Demo';

  async function initAztecSdk() {
    const r = await window.aztec.enable({
      apiKey: 'ethglobalstarterkit'
    });
    console.log(r);
    return r;
  };

const loadSdk = async () => {

  
  let script = window.document.createElement('script');
  script.type = 'text/javascript';
  script.async = true;
  script.src = 'http://localhost:5555/sdk/aztec.js';
  const scriptLoaded = new Promise((resolve)=>{
    script.onload = resolve;
  });
  document.getElementsByTagName('head')[0].appendChild(script);

  await scriptLoaded;

  const r = await initAztecSdk();
  return r;

}

<Demo demoScript={loadSdk} text='Enable SDK'/>
```
