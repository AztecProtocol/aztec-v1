/**
 * @jest-environment node
 */

const importInstaller = () => require('../src/installer.js').default; // eslint-disable-line global-require

describe('installer', () => {
    it('log error if window is not defined', () => {
        const errors = [];
        const errorLogMock = jest.spyOn(console, 'error').mockImplementation((error) => {
            errors.push(error);
        });

        importInstaller();
        expect(errors).toEqual(['AZTEC SDK can only be run in web browser.']);

        errorLogMock.mockRestore();
    });
});
