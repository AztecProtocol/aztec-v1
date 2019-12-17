import * as JsPDF from 'jspdf';
import i18n from '~/ui/helpers/i18n';

const backup = async ({
    seedPhrase,
}) => {
    const {
        web3: {
            currentProvider: {
                selectedAddress,
            },
        },
    } = window;

    const doc = new JsPDF();
    doc.setFontType('bold');
    doc.setFontSize(24);
    doc.setTextColor('#191F34');
    doc.text(20, 30, i18n.t('register.backup.pdf.title'));
    doc.setFontSize(16);
    doc.setFontType('light');
    const blurb = doc.splitTextToSize(i18n.t('register.backup.pdf.blurb'), 170);
    doc.text(blurb, 20, 45);
    doc.setFontType('bold');
    doc.text(i18n.t('register.backup.pdf.account'), 20, 62);
    doc.setFontType('light');
    doc.text(selectedAddress, 70, 62);
    doc.setDrawColor('#ffffff');
    doc.setFillColor('#808DFF');
    doc.roundedRect(20, 70, 170, 65, 2, 2, 'FD');
    doc.setTextColor('#ffffff');
    const warning = doc.splitTextToSize(i18n.t('register.backup.pdf.warning'), 150);
    doc.text(warning, 30, 85);
    doc.setFontType('bold');

    doc.text(i18n.t('register.backup.pdf.recovery'), 30, 105);
    const phrase = doc.splitTextToSize(seedPhrase, 150);
    doc.setFontType('light');

    doc.text(phrase, 30, 115);
    const response = await doc.save(i18n.t('register.backup.pdf.filename'), { returnPromise: true });
    return response;
};

export default backup;
