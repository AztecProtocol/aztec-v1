import * as defaultSettings from '~/config/settings';
import extensionSettings from '~/database/models/extensionSettings';

export default async function settings(name) {
    let value = await extensionSettings.get({
        name,
    });
    if (!value) {
        value = defaultSettings[name];
    }

    return value;
}
