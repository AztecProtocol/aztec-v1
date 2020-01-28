const directions = [
    [1, 1],
    [1, -1],
    [-1, -1],
    [-1, 1],
];

export default function shapeGenerator({
    diameter,
    colorScheme,
    rand,
    randomInt,
}) {
    const radius = diameter / 2;
    const diagonal = diameter * Math.sqrt(2);

    const colorIndexes = Array.from({ length: colorScheme.length }, (_, i) => i);
    const getColor = () => {
        const idx = randomInt(colorIndexes.length - 1);
        const [colorIdx] = colorIndexes.splice(idx, 1);
        return colorScheme[colorIdx];
    };

    const shapes = [];

    const bgCenter = diameter * (randomInt(30, 70) / 100);
    const bgSquare0 = {
        type: 'rect',
        fill: getColor(),
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

    const dirIndexC1 = (dirIndexC0 + 2) % 4;
    const [factorXC1, factorYC1] = directions[dirIndexC1];
    const rRatioC1 = randomInt(10, 40);
    const radiusC1 = diameter * (rRatioC1 / 100);
    const circle1 = {
        type: 'circle',
        fill: getColor(),
        r: radiusC1,
        cx: radius + (radius * rand() * factorXC1),
        cy: radius + (radius * rand() * factorYC1),
    };
    shapes.push(circle1);

    if (rRatioC1 < 20) {
        const radiusC2 = diameter * (randomInt(6, rRatioC1 - 5) / 100);
        const shift = radiusC1 + (radiusC2 * 3 * rand());
        const circle2 = {
            type: 'circle',
            fill: getColor(),
            r: radiusC2,
            cx: circle1.cx + (shift * factorXC0),
            cy: circle1.cy + (shift * factorYC0),
        };
        shapes.push(circle2);
    } else {
        const [factorXT0, factorYT0] = [-factorXC1, factorYC1];
        const angleT0 = randomInt(40, 55);
        const triangle0 = {
            type: 'rect',
            fill: getColor(),
            width: diagonal,
            height: diagonal,
            x: (diagonal / 2) * factorXT0,
            y: (diagonal / 2) * factorYT0,
            transform: `rotate(-${angleT0}, ${diameter / 2} ${diameter / 2})`,
            rx: 2 * randomInt(2, 8),
            fillOpacity: randomInt(60, 90) / 100,
        };
        shapes.push(triangle0);
    }

    return {
        viewBox: `0 0 ${diameter} ${diameter}`,
        width: diameter,
        height: diameter,
        transform: `rotate(${randomInt(180)})`,
        children: shapes,
    };
}
