import React, {
    PureComponent,
} from 'react';
import PropTypes from 'prop-types';
import Assets from '~/ui/views/Assets';
import Asset from '~/ui/views/Asset';
import apis from '~uiModules/apis';

class Account extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            currentAsset: '',
            assets: [],
            pastTransactions: [],
            isLoadingAssets: true,
            isLoadingTransactions: true,
        };

        this.cachedTransactions = {};
    }

    componentDidMount() {
        this.fetchAssets();
        this.fetchPastTransactions();
    }

    handleClearCurrentAsset = () => {
        this.handleClickAsset({ code: '' });
    };

    handleClickAsset = (asset) => {
        const {
            code,
        } = asset;
        const {
            currentAsset,
        } = this.state;
        if (code === currentAsset) return;

        const pastTransactions = this.cachedTransactions[code];
        this.setState(
            {
                currentAsset: code,
                isLoadingTransactions: !pastTransactions,
                pastTransactions,
            },
            !pastTransactions
                ? () => this.fetchPastTransactions(code)
                : null,
        );
    };

    handleClickTransaction = (transaction) => {
        console.log(transaction);
    };

    async fetchAssets() {
        const assets = await apis.asset.getAssets();
        this.setState({
            assets,
            isLoadingAssets: false,
        });
    }

    async fetchPastTransactions(code) {
        const pastTransactions = await apis.asset.getPastTransactions(code);
        this.cachedTransactions[code] = pastTransactions;
        this.setState({
            pastTransactions,
            isLoadingTransactions: false,
        });
    }

    handleChangeCurrentAsset(assetCode) {
        this.setState({
            currentAsset: assetCode,
            pastTransactions: [],
        });
    }

    render() {
        const {
            currentAsset,
            assets,
            pastTransactions,
            isLoadingAssets,
            isLoadingTransactions,
        } = this.state;


        if (currentAsset) {
            const asset = assets.find(({ code }) => code === currentAsset);
            return (
                <Asset
                    {...asset}
                    pastTransactions={pastTransactions}
                    isLoadingTransactions={isLoadingTransactions}
                    goBack={this.handleClearCurrentAsset}
                />
            );
        }

        const {
            goBack,
            onClose,
        } = this.props;

        return (
            <Assets
                assets={assets}
                pastTransactions={pastTransactions}
                isLoadingAssets={isLoadingAssets}
                isLoadingTransactions={isLoadingTransactions}
                goBack={goBack}
                onClose={onClose}
                onClickAsset={this.handleClickAsset}
                onClickTransaction={this.handleClickTransaction}
            />
        );
    }
}

Account.propTypes = {
    goBack: PropTypes.func,
    onClose: PropTypes.func,
};

Account.defaultProps = {
    goBack: null,
    onClose: null,
};

export default Account;
