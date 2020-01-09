```jsx
import apiKey from '../../config/apiKey';
import Demo from '../../../src/components/Demo/Demo';

import loadSDK from '../../utils/loadSDK';

async function enable() {
    await loadSDK();
    return window.aztec.enable({
        apiKey,
    });
}
<Demo demoScript={enable} text="Enable SDK" />;
```

```js
```

```jsx
import Demo from '../../../src/components/Demo/Demo';
const assetAddress = '0x3339C3c842732F4DAaCf12aed335661cf4eab66b';

async function zkAsset() {
    return window.aztec.zkAsset(assetAddress);
}

<Demo demoScript={zkAsset} text="Get zkAsset" />;
```

```jsx
import Demo from '../../../src/components/Demo/Demo';
const assetAddress = '0x3339C3c842732F4DAaCf12aed335661cf4eab66b';

async function balance() {
    const asset = await window.aztec.zkAsset(assetAddress);
    return asset.balance();
}

<Demo demoScript={balance} text="Asset balance" />;
```
