import generateNotes from './generateNotes';

const generateTestData = () => new Promise((resolve, reject) => {
    Promise.all([
        generateNotes(),
    ])
        .then(() => resolve())
        .catch(() => reject());
});

generateTestData();
