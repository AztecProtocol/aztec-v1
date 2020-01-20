const directions = [
    [1, 1],
    [1, -1],
    [-1, -1],
    [-1, 1],
];

export default function noteIconShape({
    diameter,
    colorScheme,
    rand,
    randomInt,
}) {
    const primaryColors = colorScheme.slice(0, 2);
    const randomColors = colorScheme.slice(2);

    const radius = diameter / 2;
    const diagonal = diameter * Math.sqrt(2);

    const colorIndexes = Array.from({ length: randomColors.length }, (_, i) => i);
    const getColor = () => {
        const idx = randomInt(colorIndexes.length - 1);
        const [colorIdx] = colorIndexes.splice(idx, 1);
        return randomColors[colorIdx];
    };

    const shapes = [];

    const primarySquareColorIndex = randomInt(1);
    const squareColor = primaryColors[primarySquareColorIndex];
    const secondaryColor = primaryColors[(primarySquareColorIndex + 1) % 2];

    const bgCenter = diameter * (randomInt(30, 70) / 100);
    const bgSquare0 = {
        type: 'rect',
        fill: squareColor,
        width: diagonal,
        height: diagonal,
        y: bgCenter - diagonal,
    };
    const bgSquare1 = {
        type: 'rect',
        fill: getColor(),
        width: diagonal,
        height: diagonal,
        y: bgCenter,
    };

    const dirIndexC0 = randomInt(3);
    const [factorXC0, factorYC0] = directions[dirIndexC0];
    const circle0 = {
        type: 'circle',
        fill: getColor(),
        r: diameter * (randomInt(40, 80) / 100),
        cx: radius + (radius * factorXC0),
        cy: radius + (radius * factorYC0),
    };

    const bgShapes = factorYC0 > 0
        ? [bgSquare1, bgSquare0]
        : [bgSquare0, bgSquare1];
    shapes.push(bgShapes[0]);
    shapes.push(circle0);
    shapes.push(bgShapes[1]);

    const dirIndexT0 = (dirIndexC0 + randomInt(1, 3)) % 4;
    const pointAt = diameter * (randomInt(20, 80) / 100);
    const [factorSXT0, factorSYT0] = directions[dirIndexT0];
    const startT0 = `${radius + (radius * factorSXT0)},${radius + (radius * factorSYT0)}`;
    const [factorEXT0, factorEYT0] = directions[(dirIndexT0 + 1) % 4];
    const endT0 = `${radius + (radius * factorEXT0)},${radius + (radius * factorEYT0)}`;
    const colorT0 = getColor();
    const triangle0 = {
        type: 'polygon',
        fill: colorT0,
        points: `${startT0} ${pointAt},${bgCenter} ${endT0}`,
        strokeLinejoin: 'round',
    };
    shapes.push(triangle0);

    const dirIndexC1 = (dirIndexC0 + 2) % 4;
    const [factorXC1, factorYC1] = directions[dirIndexC1];
    const rRatioC1 = randomInt(30, 60);
    const radiusC1 = diameter * (rRatioC1 / 100);
    const circle1 = {
        type: 'circle',
        fill: getColor(),
        fillOpacity: randomInt(20, 100) / 100,
        r: radiusC1,
        cx: radius + (radius * rand() * factorXC1),
        cy: radius + (radius * rand() * factorYC1),
    };
    shapes.push(circle1);

    const [factorXT1, factorYT1] = [-factorXC1, factorYC1];
    const angleT0 = randomInt(40, 55);
    const triangle1 = {
        type: 'rect',
        fill: secondaryColor,
        width: diagonal,
        height: diagonal,
        x: (diagonal / 2) * factorXT1,
        y: (diagonal / 2) * factorYT1,
        transform: `rotate(-${angleT0}, ${diameter / 2} ${diameter / 2})`,
        rx: 2 * randomInt(2, 8),
        fillOpacity: randomInt(20, 90) / 100,
    };
    shapes.push(triangle1);

    return {
        viewBox: `0 0 ${diameter} ${diameter}`,
        width: diameter,
        height: diameter,
        transform: `rotate(${randomInt(180)})`,
        children: shapes,
    };
}
