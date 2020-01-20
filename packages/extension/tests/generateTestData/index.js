import generateUserData from './generateUserData';
import generateNotes from './generateNotes';

const generateTestData = () => new Promise(async (resolve, reject) => {
    try {
        const {
            userAccount,
        } = await generateUserData();
        await generateNotes(userAccount);
    } catch (error) {
        reject(error);
        return;
    }

    resolve();
});

generateTestData();
