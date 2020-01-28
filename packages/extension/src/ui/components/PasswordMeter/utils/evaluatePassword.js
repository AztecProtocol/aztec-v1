const rules = [
    {
        name: 'length',
        count: p => p.length,
        score: c => c * 4,
        requirement: c => c >= 8,
    },
    {
        name: 'uppercase',
        count: p => (p.match(/[A-Z]/g) || '').length,
        score: (c, len) => (c && (len - c) * 2) || 0,
        requirement: c => c > 1,
    },
    {
        name: 'lowercase',
        count: p => (p.match(/[a-z]/g) || '').length,
        score: (c, len) => (c && (len - c) * 2) || 0,
        requirement: c => c > 1,
    },
    {
        name: 'numbers',
        count: p => (p.match(/[0-9]/g) || '').length,
        score: c => c * 4,
        requirement: c => c > 1,
    },
    {
        name: 'symbol',
        count: p => (p.match(/[^0-9a-z]/ig) || '').length,
        score: c => c * 6,
        requirement: c => c > 1,
    },
    {
        name: 'middleNumberOrSymbol',
        count: p => (p.substr(1, p.length - 2).match(/[^a-z]/ig) || '').length,
        score: c => c * 2,
    },
    {
        name: 'lettersOnly',
        count: p => (p.match(/^[a-z]+$/i) && 1) || 0,
        score: (c, len) => -(c * len),
    },
    {
        name: 'numbersOnly',
        count: p => (p.match(/^[0-9]+$/) && 1) || 0,
        score: (c, len) => -(c * len),
    },
    {
        name: 'repeatCharacters',
        count: (p) => {
            const charMap = {};
            p.split('').forEach((c) => {
                charMap[c] = (charMap[c] || 0) + 1;
            });
            return Object.values(charMap)
                .reduce((accum, count) => accum + (count > 1 ? count : 0), 0);
        },
        score: c => -(c * 2),
    },
    {
        name: 'consecutiveLetters',
        count: p => (p.match(/[a-z]{1,}/ig) || []).reduce((accum, seg) => accum + (seg.length - 1), 0),
        score: c => -(c * 2),
    },
    {
        name: 'consecutiveNumbers',
        count: p => (p.match(/[0-9]{1,}/g) || []).reduce((accum, seg) => accum + (seg.length - 1), 0),
        score: c => -(c * 2),
    },
    {
        name: 'sequential',
        count: (p) => {
            let found = 0;
            for (let i = 1; i < p.length; i += 1) {
                const diff = Math.abs(p[i].charCodeAt() - p[i - 1].charCodeAt());
                if (diff === 0) {
                    found += 2;
                } else if (diff === 1) {
                    found += 1;
                }
            }
            return found;
        },
        score: c => -(c * 3),
    },
];

export default function evaluatePassword(password) {
    if (!password) {
        return 0;
    }

    const unmetRequirements = [];
    const len = password.length;
    const totalScore = rules.reduce((accum, {
        name,
        count,
        score,
        requirement,
    }) => {
        const c = count(password);
        if (requirement && !requirement(c)) {
            unmetRequirements.push(name);
        }

        return accum + score(c, len);
    }, 0);

    const score = Math.max(
        1,
        totalScore - unmetRequirements.length * 10,
    );

    return {
        score,
        base: 100,
        unmetRequirements,
    };
}
