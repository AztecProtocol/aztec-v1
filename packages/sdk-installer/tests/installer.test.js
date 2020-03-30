import aztecSdkInsterller, { SdkInstaller } from '../src/installer';
import json from '../package.json';

const { scriptId } = aztecSdkInsterller.manager;

const mockSdkLoaded = () => {
    window.aztec = {};
    window.aztecCallback();
};

beforeEach(() => {
    window.aztec = null;
    window.aztecCallback = null;
    document.body.innerHTML = '';
});

describe('installer constructor', () => {
    it('has the same version as defined in package.json', () => {
        const installer = new SdkInstaller();
        expect(installer.version).toBe(json.version);
    });

    it('append a script tag to body', () => {
        const prevScript = document.getElementById(scriptId);
        expect(prevScript).toBe(null);

        const installer = new SdkInstaller();

        const script = document.getElementById(scriptId);
        expect(script).not.toBe(null);
        expect(script.type).toBe('module');
        expect(script.src).toContain(installer.version);
    });

    it('will not append another script tag if it is already in body', () => {
        const appendChildSpy = jest.spyOn(document.body, 'appendChild');
        expect(appendChildSpy).toHaveBeenCalledTimes(0);

        const installer = new SdkInstaller();

        expect(appendChildSpy).toHaveBeenCalledTimes(1);
        const script = document.getElementById(scriptId);
        expect(script).not.toBe(null);
        expect(script.src).toContain(installer.version);

        const installer2 = new SdkInstaller();

        expect(appendChildSpy).toHaveBeenCalledTimes(1);
        expect(installer2).not.toBe(installer);
        const script2 = document.getElementById(scriptId);
        expect(script).toBe(script2);
    });

    it('will not append script tag before document is ready', () => {
        Object.defineProperty(document, 'readyState', {
            get: jest.fn(() => 'loading'),
        });

        const appendChildSpy = jest.spyOn(document.body, 'appendChild');
        appendChildSpy.mockReset();

        const installer = new SdkInstaller();

        const addSdkScriptSpy = jest.spyOn(installer.manager, 'addSdkScript');

        expect(appendChildSpy).toHaveBeenCalledTimes(0);
        const script = document.getElementById(scriptId);
        expect(script).toBe(null);
        expect(addSdkScriptSpy).toHaveBeenCalledTimes(0);

        const event = document.createEvent('Event');
        event.initEvent('DOMContentLoaded', true, true);
        window.document.dispatchEvent(event);

        expect(appendChildSpy).toHaveBeenCalledTimes(1);
        expect(addSdkScriptSpy).toHaveBeenCalledTimes(1);
    });

    it('trigger callbacks when sdk is loaded', () => {
        const cb1 = jest.fn();
        const cb2 = jest.fn();

        const installer = new SdkInstaller();
        installer.onLoad(cb1);
        installer.onLoad(cb2);

        expect(cb1).toHaveBeenCalledTimes(0);
        expect(cb2).toHaveBeenCalledTimes(0);

        mockSdkLoaded();

        expect(cb1).toHaveBeenCalledTimes(1);
        expect(cb2).toHaveBeenCalledTimes(1);
    });

    it('callbacks will be triggered immediately when sdk is loaded', () => {
        const installer = new SdkInstaller();

        mockSdkLoaded();

        const cb = jest.fn();
        installer.onLoad(cb);
        expect(cb).toHaveBeenCalledTimes(1);
    });

    it('the same callbacks will be triggered only once', () => {
        const cb = jest.fn();

        const installer = new SdkInstaller();

        installer.onLoad(cb);
        installer.onLoad(cb);

        expect(cb).toHaveBeenCalledTimes(0);

        mockSdkLoaded();

        expect(cb).toHaveBeenCalledTimes(1);
    });
});
