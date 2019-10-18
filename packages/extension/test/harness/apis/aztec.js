module.exports = async function(context, wait = false) {
    const aztec = {
        initialised: false,
        assets: {},
        metadata: {
            link: undefined,
        },
        createAsset: function(asset) {
            return {
                ...asset,
                eval: async function(fn, ...args) {
                    return context.api.evaluate(async (address, fnName, ...args) => {
                        return (await window.aztec.asset(address))[fnName](...args);
                    }, this.address, fn, ...args)
                }
            }
        },
        open: async function(specifier) {
            let extensionLink = context.metadata.link;
            if (specifier) extensionLink = `${extensionLink}#${specifier}`;
            const targets = await context.browser.targets();
            const target = targets.find(({ _targetInfo }) => _targetInfo.url.match(extensionLink));

            if (target) return context.createPageObject(await target.page(), {
                link: extensionLink,
            });
            return context.openPage(extensionLink);
        },
        findPopup: async function() {
            return context.getPage(target => target.url().match(/popup/));
        },
        setAsset: async function(address) {
            const asset = await context.api.evaluate(async (a) => await window.aztec.asset(a), address);
            this.assets[address] = this.createAsset(asset);
            return this.assets[address];
        },
        initialise: async function(wait = false) {
            await context.api.waitFor(() => !!window.aztec);
            await context.api.evaluate(async (wait) => {
                try {
                    if (wait) {
                        return window.aztec.enable();
                    } else {
                        window.aztec.enable();
                        return ;
                    }
                } catch (e) {
                    console.log(e);
                }
            }, wait);
        }
    };

    await aztec.initialise(wait)
    aztec.initialised = true;
    aztec.metadata.link = context.metadata.link.split('#')[0];
    return aztec;
};