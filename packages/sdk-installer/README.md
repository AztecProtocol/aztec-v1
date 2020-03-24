# AZTEC SDK Installer

This is a simple npm package that helps you setup AZTEC in your project.

### Install

```sh
yarn add @aztec/sdk-installer
```

or

```sh
npm install @aztec/sdk-installer
```

### Getting started

When you import installer to your code, the installer will add a script tag to the html. The content of the SDK will start loading at this point and might not be available immediately. So you will also need to provide a callback to the installer. The callback will be triggered once the SDK is ready to use.

```js
import installer from '@aztec/sdk-installer';

const startUsingAztec = () => {};

installer.onLoad(startUsingAztec);
```

_** Note that the webpage will fetch the SDK with the same version as the installer. So upgrade the installer regularly to get the latest version of the SDK._


### Using the SDK

Once the SDK is loaded, you can access `aztec` by:

```js
await window.aztec.enable();
```

or

```js
import installer from '@aztec/sdk-installer';
await installer.aztec.enable();
```

#### For the full AZTEC SDK usage
Checkout the docs here: **[https://docs.aztecprotocol.com/](https://docs.aztecprotocol.com/)**
