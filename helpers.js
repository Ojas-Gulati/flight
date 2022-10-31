let ep = 0.00001;
let zerovec = new Vector2(0, 0);

Number.prototype.between = function (a, b) {
    var min = Math.min.apply(Math, [a, b]),
        max = Math.max.apply(Math, [a, b]);
    return this > min && this < max;
};

function lineIntersection(line1, line2) {
    let point11 = line1[0];
    let point12 = line1[1];
    let point21 = line2[0];
    let point22 = line2[1];

    // now we find their intersection point
    // if this is in the interior of both pairs, we have an intersection
    // problem is the interior part
    // oh the distances bit is clever
    let p = point11;
    let q = point21;
    let r = new Vector2();
    let s = new Vector2();
    let qmp = new Vector2();
    r.subVectors(point12, point11);
    s.subVectors(point22, point21);
    let rxs = r.cross(s);
    if (rxs != 0) {
        qmp.subVectors(q, p);
        let t = qmp.cross(s) / rxs;
        let u = qmp.cross(r) / rxs;

        return [t, u];
    }
    return [Infinity, Infinity];
}

function intersects(points1, points2) {
    // console.log(points1, points2);
    let r = new Vector2();
    let s = new Vector2();
    let qmp = new Vector2();
    for (let i = 0; i < points1.length; i++) {
        for (let j = 0; j < points2.length; j++) {
            let [t, u] = lineIntersection([points1[i], points1[(i + 1) % points1.length]], [points2[j], points2[(j + 1) % points2.length]]);
            if (0 <= t && t <= 1 && 0 <= u && u <= 1) {
                // intersection
                return true;
            }
        }
    }
    return false;
}

function perpVec(point) {
    return new Vector2(point.y, 0 - point.x);
}

function pointtoline(point, line) {
    // line is an array of 2 points
    // step 1: make some points
    let p = line[0];
    let q = line[1];

    // step 2: get from P to point
    let ptopoint = new Vector2().copy(point).sub(p);
    // step 3: normal vector is necessary
    let normal = perpVec(new Vector2().copy(q).sub(p));
    // step 4: finish
    return ptopoint.dot(normal) / normal.length();
}

function projectoline(point, line) {
    // line is an array of 2 points
    // step 1: make some points
    let p = line[0].clone();
    let q = line[1].clone();

    // step 2: get from P to point
    let ptopoint = new Vector2().copy(point).sub(p);
    let linevec = new Vector2().copy(q).sub(p);
    // step 4: finish
    return p.add(linevec.multiplyScalar(linevec.dot(ptopoint) / linevec.dot(linevec)));
}

function distance(a, b) {
    return a.clone().sub(b).length();
}

function pointtolinesegment(point, line) {
    // distance from a point to a line segment
    // not distance from a point to an infinite line
    let proj = projectoline(point, line);
    let p = line[0].clone();
    let q = line[1].clone();
    if (distance(proj, p) + distance(proj, q) - distance(p, q) < ep) {
        return [distance(point, proj), proj];
    }
    else {
        let pdist = distance(point, p);
        let qdist = distance(point, q);
        if (pdist < qdist) {
            return [pdist, p]
        }
        else {
            return [qdist, q]
        }
    }
}

function lineEq(line) {
    let a = line[1].y - line[0].y;
    let b = line[0].x - line[1].x;
    let c = (a * line[0].x) + (b * line[0].y);
    return [a, b, c];
}

function linepassesthroughpoint(line, point) {
    // lineeq => ax + by = c;
    let [a, b, c] = lineEq(line);
    return (c == ((a * point.x) + (b * point.y)))
}

function angleBetween(vec1, vec2) {

}

function orderShape(points) {
    // orders the points in a shape so that a 90 deg CCW rotation from a point[x => x + 1] vector points towards the interior
    // find normal direction
    // for this rotate 90 counterclockwise for a normal, and then do the intersection thing
    // for the intersection thing make sure to count intersecting points as only one intersection (i.e., dont let lines double count)
    // step 1: pick line 1
    let line1 = [points[0], points[1]];
    let linevec = new Vector2().subVectors(line1[1], line1[0]);
    let midpoint = new Vector2().addVectors(points[0], points[1]).multiplyScalar(0.5);
    let moveVec = midpoint.clone().add(linevec.clone().rotateAround(new Vector2(), (Math.PI / 2))); // counterclockwise move vec (TODO, maybe optimise?)
    // first, extend the vector
    let passessbools = [];
    let intersections = 1; // by default, Math.PI/2 is the CORRECT rotation for the interior if intersections == 0 % 2
    for (let i = 0; i < points.length; i++) {
        // see if you pass through this specific point
        let ptp = linepassesthroughpoint([midpoint, moveVec], points[i]);
        passessbools.push(ptp);
        if (ptp) {
            intersections += 1;
        }
    }

    for (let i = 1; i < points.length; i++) {
        // see if we pass through this line
        if ((!passessbools[i]) && (!passessbools[(i + 1) % points.length])) {
            let [t, u] = lineIntersection([midpoint, moveVec], [points[i], points[(i + 1) % points.length]]);
            if (t > 0 && 0 < u && u < 1) {
                intersections += 1;
            }
        }
    }

    if ((intersections % 2) == 0) {
        // rotating points by Math.PI/2 CCW will give us the interior
    }
    else {
        points.reverse();
        // rotating points by Math.PI/2 CCW will *still* give us the interior
    }
}

function projectAheadPoint(line, point, velocity) {
    let [t, u] = lineIntersection([point, point.clone().add(velocity)], line);
    if (0 <= t && t < 1 && 0 <= u && u <= 1) {
        return t;
    }
    else {
        return Infinity;
    }
}

function xplusky(x, k, y) {
    return x.clone().add(y.clone().multiplyScalar(k));
}

function findComponentLength(vec, direction) {
    // line is an array of 2 points
    // step 1: make some points
    let p = new Vector2();
    let q = direction;

    // step 2: get from P to point
    let ptopoint = new Vector2().copy(vec).sub(p);
    let linevec = new Vector2().copy(q).sub(p);
    // step 4: finish
    return (linevec.dot(ptopoint) / linevec.dot(linevec)) * linevec.length();
}

function gradient(vector) {
    // flip our vector into position
    let grad = new Vector2(vector.x < 0 ? 0 - vector.x : vector.x, vector.y < 0 ? 0 - vector.y : vector.y);
    return grad.taxicabAngle();
}

function setComponent(vec, component, size) {
    let heightProjection = findComponentLength(vec, component.clone());
    vec.add(component.clone().setLength(1).multiplyScalar(Math.min(Math.max(size - heightProjection, 0), size)))
    // DEPRECATED
}

function accelerateComponent(vec, component, size, rate) {
    let heightProjection = findComponentLength(vec, component);
    let toadd = Math.max(Math.min(size * rate, size - heightProjection), 0); // try to inc by size - rate, but dont inc if we will hit size
    vec.add(component.clone().setLength(1).multiplyScalar(toadd))
}

function encouragingCollision(linevec, velocity) {
    let normalInsideVec = linevec.clone().rotateAround(new Vector2(), (Math.PI / 2));
    let velocityVec = velocity;
    // now we need to check if velocityVec is on the same side of linevec as insideVec
    let [a, b, c] = lineEq([new Vector2(), linevec]);
    let sign1 = c - ((a * normalInsideVec.x) + (b * normalInsideVec.y))
    let sign2 = c - ((a * velocityVec.x) + (b * velocityVec.y));
    return (sign1 * sign2) >= 0;
}

function makeVector(lineArr) {
    return new Vector2().subVectors(lineArr[1], lineArr[0])
}

function projectForCollision(points1, points2, points1vec, points1isShape, points2isShape, logdists = false) {
    // if points1 is moving with velocity points1vec, calculates timetocollision with points2.
    // returns objects of:
    // {
    //     "points1point": point, [on line points1[points] => points1[points + 1]]
    //     "distanceData": {
    //         "distance": dist,
    //         "linestart": i,    [on line points2[points] => points2[points + 1]]
    //         "nearestP": xplusky(point, dist, player.velocity),
    //         "linevec": new Vector2().subVectors(rail.points[i + 1], rail.points[i])
    //     }
    // }
    let revVelocity = points1vec.clone().multiplyScalar(-1);
    let railcols = [];
    for (let j = 0; j < points1.length - (points1isShape ? 0 : 1); j++) {
        let playerline = [points1[j], points1[(j + 1) % points1.length]]
        let lvec = new Vector2().subVectors(playerline[1], playerline[0]).multiplyScalar(-1);
        for (let i = 0; i < points2.length; i++) {
            if (encouragingCollision(makeVector(playerline), revVelocity)) {
                let dist = projectAheadPoint(playerline, points2[i], revVelocity);
                if (dist < Infinity) {
                    railcols.push({
                        "playerPoint": points1[j],
                        "distanceData": {
                            "distance": dist,
                            "linestart": Math.max(0, i - 1),
                            "nearestP": xplusky(points2[i], dist, revVelocity),
                            "linevec": lvec
                        }
                    })
                }
            }
        }
    }
    for (let point of points1) {
        for (let i = 0; i < points2.length - (points2isShape ? 0 : 1); i++) {
            let line = [points2[i], points2[(i + 1) % points2.length]];
            // ok
            // we can use a similar intersection strategy here
            // we can make the lines position, position + velocity (t) and line1, line2 (u)
            // t is the percentage, if t negative, bump to infinity on the return

            if (encouragingCollision(makeVector(line), points1vec)) {
                let dist = projectAheadPoint(line, point, points1vec);
                if (dist < Infinity) {
                    railcols.push({
                        "playerPoint": point,
                        "distanceData": {
                            "distance": dist,
                            "linestart": i,
                            "nearestP": xplusky(point, dist, points1vec),
                            "linevec": new Vector2().subVectors(points2[(i + 1) % points2.length], points2[i])
                        }
                    })
                }
            }
        }
    }

    return railcols;
}

function absmin(a, b) {
    if (Math.abs(a) < Math.abs(b)) {
        return a;
    }
    return b;
}

function findCamera(camera_settings, position) {
    // camera_settings is a list of "regions", for now just rectangles
    for (let i = 0; i < camera_settings.length; i++) {
        if (camera_settings[i][1] === null ||
            (position.x.between(camera_settings[i][1][0].x, camera_settings[i][1][1].x) && position.y.between(camera_settings[i][1][0].y, camera_settings[i][1][1].y))) {
            return [camera_settings[i][0], camera_settings[i][2]];
        }
    }
    return [new Vector2(0, 0), 1];
}

function linearTiming(x) {
    return x;
}
function quadratic_timing(x) {
    return (0 - (x * x) + (2 * x))
}
function cubic_timing(x) {
    return 1 - Math.pow((1 - x), 3);
}

function pathRegularPolygon(ctx, center, point, sides) {
    //console.log("hi " + sides)
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    let radiusVec = new Vector2().subVectors(point, center);
    for (let i = 1; i <= sides; i++) {
        let newpoint = new Vector2().addVectors(center, radiusVec.rotateAround(new Vector2(), Math.PI * (2 / sides)))
        ctx.lineTo(newpoint.x, newpoint.y);
        // console.log(newpoint);
    }
}

function cubicBounce(x) {
    if (x >= 0 && x <= 1) {
        return x * (x - 1) * (x - 1) * (x - 2) * -4
    }
    return 0;
}

function makeEpsilonSquare(point, epsilon) {
    let square = [point.clone().add(new Vector2(epsilon, epsilon)),
    point.clone().add(new Vector2(epsilon, -epsilon)),
    point.clone().add(new Vector2(-epsilon, -epsilon)),
    point.clone().add(new Vector2(-epsilon, epsilon))];
    orderShape(square);
    return square;
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */
function randomint(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function drawStar(cx, cy, spikes, outerRadius, innerRadius) {
    var rot = Math.PI / 2 * 3;
    var x = cx;
    var y = cy;
    var step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius)
    for (i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y)
        rot += step

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y)
        rot += step
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
}

function makeRectanglePoints(corner1, corner2) {
    return [corner1.clone(), new Vector2(corner1.x, corner2.y), corner2.clone(), new Vector2(corner2.x, corner1.y)]
}

function binarySearch(ar, el, compare_fn) {
    var m = 0;
    var n = ar.length - 1;
    while (m <= n) {
        var k = (n + m) >> 1;
        var cmp = compare_fn(el, k);
        if (cmp > 0) {
            m = k + 1;
        } else if(cmp < 0) {
            n = k - 1;
        } else {
            return k;
        }
    }
    return -m - 1;
}

function makeTimingFunction(options) {
    let processed_nodes = options.nodes // .sort((a, b) => a[0] - b[0]);
    let period = options.period * (options.bounce ? 2 : 1);
    let t_func = options.timing_func;
    if (options.bounce) {
        // add bouncing nodes
        let optNodesLen = options.nodes.length
        for (let i = optNodesLen - 1; i >= 0; i--) {
            processed_nodes.push([(period - 1) - options.nodes[i][0], options.nodes[i][1]])
        }
    }
    return (frnum) => {
        let framenum = frnum % period;
        // calculate which one we're in
        let location = binarySearch(processed_nodes, framenum, (fnum, idx) => {
            if (fnum >= processed_nodes[idx][0]) {
                // okayyyy, but is this the right period?
                let next = processed_nodes[(idx + 1) % processed_nodes.length][0];
                if (next < processed_nodes[idx][0]) next += period;
                if (fnum < next) {
                    return 0
                }
                else {
                    return 1;
                }
            } else return -1;
        });
        if (location < 0) {
            location = processed_nodes.length - 1;
            framenum += period;
        }
        // now finally, find a % and project
        // easy stuff
        let currNode = processed_nodes[location];
        let nextNode = processed_nodes[(location + 1) % processed_nodes.length];
        let nextFnum = nextNode[0];
        if (nextFnum < currNode[0]) nextFnum += period
        let percent = t_func((framenum - currNode[0]) / (nextFnum - currNode[0]));
        return new Vector2().addVectors(currNode[1].clone().multiplyScalar(1 - percent), nextNode[1].clone().multiplyScalar(percent))
    }
}