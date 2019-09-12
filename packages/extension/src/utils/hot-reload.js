import browser from 'webextension-polyfill';
/*
 * https://github.com/xpl/crx-hotreload
 */

const excludes = [
    /^\./,
    /^ui$/,
    /ui\.css/,
    /bundle\.ui\./,
];

const filesInDirectory = dir => new Promise((resolve) => {
    dir
        .createReader()
        .readEntries(async (entries) => {
            const readFilePromises = entries
                .filter(e => !excludes.some(p => e.name.match(p)))
                .map((e) => {
                    if (e.isDirectory) {
                        return filesInDirectory(e);
                    }
                    return new Promise(resolveFile => e.file(resolveFile));
                });
            const files = await Promise.all(readFilePromises);
            resolve([].concat(...files));
        });
});

const timestampForFilesInDirectory = dir => filesInDirectory(dir)
    .then(files => files.map(f => `${f.name}${f.lastModifiedDate}`).join());

const reload = async () => {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });

    if (tabs[0]) {
        console.log('tabs', tabs);
        browser.tabs.reload(tabs[0].id);
    }

    browser.runtime.reload();
};

const watchChanges = (dir, lastTimestamp) => {
    timestampForFilesInDirectory(dir).then((timestamp) => {
        if (!lastTimestamp || (lastTimestamp === timestamp)) {
            setTimeout(() => watchChanges(dir, timestamp), 1000);
        } else {
            reload();
        }
    });
};

browser.management.getSelf()
    .then((self) => {
        if (self.installType === 'development') {
            browser.runtime.getPackageDirectoryEntry(dir => watchChanges(dir));
        }
    });
