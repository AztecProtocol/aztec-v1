export default function userIconShape({
    diameter,
    colorScheme,
    randomInt,
}) {
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
    shapes.push(bgSquare0);

    const bgSquare1 = {
        type: 'rect',
        fill: getColor(),
        width: diagonal,
        height: diagonal,
        y: bgCenter,
    };
    shapes.push(bgSquare1);

    const bgSquare2 = {
        type: 'rect',
        fill: getColor(),
        width: diameter * (randomInt(30, 70) / 100),
        height: diagonal,
        y: bgCenter,
    };
    shapes.push(bgSquare2);

    const pointAt = diameter * (randomInt(20, 80) / 100);
    const triangle0 = {
        type: 'polygon',
        fill: getColor(),
        points: `0,0 ${pointAt},${bgCenter} ${diameter},0`,
    };
    shapes.push(triangle0);

    const triangle1 = {
        type: 'polygon',
        fill: getColor(),
        points: `0,0 ${pointAt},${bgCenter} 0,${diameter}`,
        fillOpacity: randomInt(60, 90) / 100,
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
