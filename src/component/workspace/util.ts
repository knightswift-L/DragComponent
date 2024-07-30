type Point = {
    x: number,
    y: number
}


export function checkPointInArea(point: Point, area: Array<Point>): boolean {
    const num_vertices = area.length;
    const x = point.x;
    const y = point.y;
    let inside = false;

    let p1 = area[0];
    let p2;

    for (let i = 1; i <= num_vertices; i++) {
        p2 = area[i % num_vertices];
        if (y > Math.min(p1.y, p2.y)) {
            if (y <= Math.max(p1.y, p2.y)) {
                if (x <= Math.max(p1.x, p2.x)) {
                    const x_intersection = ((y - p1.y) * (p2.x - p1.x)) / (p2.y - p1.y) + p1.x;

                    if (p1.x === p2.x || x <= x_intersection) {
                        inside = !inside;
                    }
                }
            }
        }

        p1 = p2;
    }

    return inside;
}