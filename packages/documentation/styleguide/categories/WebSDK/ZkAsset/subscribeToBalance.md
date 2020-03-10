## Examples


### Display different messages based on the balance.

```js static
// Fetch the zkAsset
const zkAssetAddress = '0x54Fac13e652702a733464bbcB0Fb403F1c057E1b';
const asset = await window.aztec.zkAsset(zkAssetAddress);

// Create a function that renders a message to the page
const showBalance = (balance) => {
  document.getElementById('asset-balance').innerHTML = balance < 10
    ? 'Insufficient funds'
    : `Available funds: ${balance}`;
};

// Listen to balance changes
asset.subscribeToBalance(showBalance);
```

&nbsp;
&nbsp;

### Unsubscribe when the listener is not needed or is no longer available.

```js static
class Wallet extends React.Component {
  componentDidMount() {
    this.asset.subscribeToBalance(this.updateBalance);
  }

  componentWillUnmount() {
    this.asset.unsubscribeToBalance(this.updateBalance);
  }
}
```
