const adjectives = ['swift', 'calm', 'clever', 'bold', 'quirky', 'bright', 'wise', 'keen', 'sharp', 'witty'];
const animals = ['otter', 'lynx', 'panda', 'falcon', 'koala', 'fox', 'wolf', 'eagle', 'tiger', 'bear'];

function seededRandom(seed) {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xfffffff;
    return () => (h = (h * 48271) % 0x7fffffff) / 0x7fffffff;
}

function generateAnonymousName(rng) {
    const adj = adjectives[Math.floor(rng() * adjectives.length)];
    const animal = animals[Math.floor(rng() * animals.length)];
    const num = Math.floor(rng() * 90 + 10);
    return `${adj}_${animal}_${num}`;
}

exports.buildSession = (idA, idB) => {
    const low = idA < idB ? idA : idB;
    const high = idA < idB ? idB : idA;

    const rngA = seededRandom(low + '_' + high + '_A');
    const rngB = seededRandom(low + '_' + high + '_B');

    const sessionId = `sess_${low}_${high}`;
    const nameA = generateAnonymousName(rngA);
    const nameB = generateAnonymousName(rngB);

    if (idA === low) {
        return {
            sessionId,
            userName: nameA,
            partnerName: nameB
        };
    } else {
        return {
            sessionId,
            userName: nameB,
            partnerName: nameA
        };
    }
};
