log("test3");

let gravity = 10;
let FPS = 60;

let gravAccVector = new Vector2(0, 0 - (gravity / FPS));

log("levle");

class PhysicsObject {
    constructor(mass) {
        this.position = new Vector2(0, 50);
        this.velocity = new Vector2(0, 0);
        this.nextGravity = new Vector2().copy(gravAccVector);
        this.hitboxX = 10;
        this.hitboxY = 20;

        this.hitboxPoints = [new Vector2(- this.hitboxX / 2, - this.hitboxY / 2), new Vector2(this.hitboxX / 2, - this.hitboxY / 2),
        new Vector2(this.hitboxX / 2, this.hitboxY / 2), new Vector2(- this.hitboxX / 2, this.hitboxY / 2)];
        this.hitboxPointsToReturn = [new Vector2(), new Vector2(), new Vector2(), new Vector2()];

        this.mass = mass;
    }
    render(ctx, framenum) {

    }
    velocitystep(framenum) {
        this.velocity.add(this.nextGravity);    // the velocity increment is done first
    }
    positionstep(framenum, percent) {
        this.position.add(this.velocity.clone().multiplyScalar(percent));
    }
    createHitboxPoints() {
        for (let i = 0; i < this.hitboxPoints.length; i++) {
            this.hitboxPointsToReturn[i].addVectors(this.position, this.hitboxPoints[i]);
        }
        return this.hitboxPointsToReturn;
    }
}

class Player extends PhysicsObject {
    constructor(mass) {
        super(mass)
    }
    render(ctx, framenum) {
        ctx.fillStyle = "red";
        ctx.fillRect(this.position.x - (this.hitboxX / 2), this.position.y - (this.hitboxY / 2),
            this.hitboxX, this.hitboxY)
    }
}

class LevelObject {
    constructor() { }
    render(ctx, framenum) {
        // draw this object in the space [THIRD]
    }
    applyVeloc(player, framenum, input) {
        // this is intended for velocity fields i.e. velocity modifications that are not through a rail
    }
    projectMovement(player) {
        // return the rails that we're on a collision course with
        return [];
    }
    closestRails(player) {
        // only return the rails close enough to interact with
        return [];
    }
    timestep(framenum) {
        // update internal properties for a render FIRST in a timestep
    }
}

class Rail {
    constructor(points, types = { "collision": true }, options = {}) {
        // for now, rails are groups of straight lines, 1px wide
        // these points MUST BE CLOCKWISE
        // during interactions, objects can try to find nearest rails, what part of the rail they're nearest to and perform clampings based on this (for walking)
        // when arrow key inputs on a object clamped to a rail, we can perform movement on that rail by using the rail's gradient to set an appropriate velocity vector
        // so if running into a slope, the gradient will apply an upwards/to the right velocity
        // this allows for this momentum to carry on a jump

        // if the rail is slippery, we can tell it to calculate the acceleration due to gravity, factoring its slope directly.
        // infact, it may be possible to make this entirely out of rails, but if the rail code is complete, it's easily extendable.

        this.frictionMul = 1;
        this.points = points;
        this.types = types;
        this.accessedTimestep = -1;
        this.clampeds = []; // these are the objects currently on this rail
    }
    distance(point) {
        let mindistance = Infinity;
        let minP = -1;
        let nearest = new Vector2();
        // go through each line in the rail
        for (let i = 0; i < this.points.length - 1; i++) {
            // how far away are you from the rail
            let [currDist, currclamp] = pointtolinesegment(point, [this.points[i], this.points[i + 1]]);
            if (currDist < mindistance) {
                mindistance = currDist;
                minP = i;
                nearest.copy(currclamp);
            }
        }
        return {
            "distance": mindistance,
            "linestart": minP,
            "nearestP": nearest,
            "projTo": new Vector2().subVectors(this.points[minP + 1], this.points[minP])
        };
    }
    modifyVelocities(player, framenum, distanceData, input) {
        // ONLY ADJUST A VELOCITY VECTOR IF IT ENCOURAGES COLLISION
        // in other words, use polygon winding numbers to calculate interiors
        // if a velocity threatens to breach through this rail into an interior, kill it
        // otherwise ignore

        // so now we know that rotating the rail 90 CCW will get us to the interior
        // we can take the linevec and make it so that we
        let point = distanceData.linestart;
        
        let linevec = distanceData.projTo;
        let normalInsideVec = linevec.clone().rotateAround(new Vector2(), (Math.PI / 2));
        let velocityVec = player.velocity;
        // now we need to check if velocityVec is on the same side of linevec as insideVec
        let [a, b, c] = lineEq([new Vector2(), linevec]);
        let sign1 = c - ((a * this.points[point].x) + (b * this.points[point].y))
        let sign2 = c - ((a * this.points[point + 1].x) + (b * this.points[point + 1].y));
        if ((sign1 * sign2) >= 0) {
            // add a little bit of monika
            player.velocity = projectoline(player.velocity, [new Vector2(), linevec]);
        }
        // now if the velocity is very close in angle, add a little bit more monika
        // if (player.velocity.angle() - )
    }
}

class Block extends LevelObject {
    constructor(points) {
        super();
        this.points = points;
    }
    render(ctx, framenum) {
        ctx.lineWidth = this.width;

        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.moveTo(...this.points[0].toArray());
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(...this.points[i].toArray())
        }

        ctx.fill();
    }
}

let railclampdist = 0.01 // HYPERPARAMETER
class Wall extends Block {
    constructor(points) {
        super(points);

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

        this.rails = [];
        for (let i = 0; i < points.length; i++) {
            this.rails.push(new Rail([points[i], points[(i + 1) % points.length]]));
        }
    }
    projectMovement(player) {
        // return the rails that we're on a collision course with
        // TODO: if a small angle adjustment will prevent collision, make it
        let railcols = [];
        for (let j = 0; j < player.hitboxPointsToReturn.length; j++) {
            let point = player.hitboxPointsToReturn[j];
            for (let rail of this.rails) {
                let exclusionList = [];
                for (let i = 0; i < rail.points.length; i++) {
                    // do a reverse projection
                    let playerLine = [point, player.hitboxPointsToReturn[(j + 1) % player.hitboxPointsToReturn.length]];
                    let revVelLine = [rail.points[i], rail.points[i].clone().sub(player.velocity)];
                    let [t, u] = lineIntersection(revVelLine, playerLine);
                    if (0 < t && t < 1 && 0 <= u && u <= 1) { // hyperp
                        //railcols.push({
                        //    "rail": rail,
                        //    "playerPoint": playerLine[0].clone().multiplyScalar(1 - t).add(playerLine[1].clone().multiplyScalar(t)),
                        //    "distanceData": {
                        //        "distance": t,
                        //        "linestart": Math.max(0, i - 1),
                        //        "nearestP": rail.points[i],
                        //        "projTo": new Vector2().subVectors(playerLine[1], playerLine[0])
                        //    }
                        //});
                        //exclusionList.push(false);
                    }
                    else {
                        //exclusionList.push(true);
                    }
                    exclusionList.push(true);
                }
                for (let i = 0; i < rail.points.length - 1; i++) {
                    if (exclusionList[i] && exclusionList[j]) {
                        let line = [rail.points[i], rail.points[i + 1]];
                        // ok
                        // we can use a similar intersection strategy here
                        // we can make the lines position, position + velocity (t) and line1, line2 (u)
                        // t is the percentage, if t negative, bump to infinity on the return
                        let [t, u] = lineIntersection([point, point.clone().add(player.velocity)], line);
                        if (0 <= t && t <= 1 && 0 <= u && u <= 1) {
                            railcols.push({
                                "rail": rail,
                                "playerPoint": point,
                                "distanceData": {
                                    "distance": t,
                                    "linestart": i,
                                    "nearestP": point.clone().add(player.velocity.clone().multiplyScalar(t)),
                                    "projTo": new Vector2().subVectors(line[1], line[0])
                                }
                            })
                        }
                    }
                }
            }
        }
        railcols.sort((a, b) => a.distanceData.distance - b.distanceData.distance);
        if (railcols.length == 0) return [];
        return [railcols[0]];   // TODO: this *needs* to return the smallest couple
    }
    closestRails(player) {
        // only return the rails close enough to interact with
        let closestrails = [];
        for (let point of player.hitboxPointsToReturn) {
            for (let rail of this.rails) {
                let dist = rail.distance(point);
                if (dist.distance < railclampdist) { // HYPERPARAMETER
                    closestrails.push({
                        "rail": rail,
                        "playerPoint": point,
                        "distanceData": dist
                    });
                }
            }
        }
        closestrails.sort((a, b) => a.distanceData.distance - b.distanceData.distance);
        if (closestrails.length == 0) return [];
        return [closestrails[0]];   // TODO: this also needs to return the smallest couple
    }
}

// rails are cool, but lets redesign this

class Level {
    constructor(objects) {
        this.objects = objects;
        this.camera = new Vector2(0, -150); // the camera is what is in the center of the screen
    }
    timestep(player, ctx, canvas, framenum) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(1, 0, 0, -1, canvas.width / 2 - this.camera.x, canvas.height / 2 + this.camera.y);

        try {
        let input = {};
        // step 1: each timestep, add a function applyVeloc to allow objects to apply velocity vectors onto the player (e.g. speed boosts)
        player.createHitboxPoints();
        player.nextGravity.copy(gravAccVector);
        for (let obj of this.objects) {
            obj.timestep(framenum);
            obj.render(ctx, framenum);
        }
        for (let obj of this.objects) {
            obj.applyVeloc(player, framenum, input);
        }

        // step 2: when we step the player, go through every single object and all of their collision rails
        //          look at the velocity vector and see what % of the velocity vector we can go through before having to stop
        //          this is good as ziplines can see where the velocity vector is coming from before forcing a collision
        let projections = []; // this is an array of the projection distances and the rails limiting the interaction
        // contains the rail, nearest point, and point of the rail that this hits on
        let closestRails = [];
        for (let obj of this.objects) {
            projections.push(...obj.projectMovement(player));
            let clr = JSON.stringify(obj.closestRails(player));
            closestRails.push(...obj.closestRails(player))
        }

        projections.sort((a, b) => a.distanceData.distance - b.distanceData.distance);
        // now go through the limiting / smallest projections
        // step 3: if there is some rail that limits this % to < 1, find the most limiting (smallest %) rail(s) and make that the rail that the player is clamped to
        //          this will allow the rail to project velocity vectors and handle inputs for the next timestep
        //          in addition, allow very close rails to be clamped and do velocity vector modification
        // step 3.5: allow clamped rails to modify velocities
        let railstomodify = [...closestRails];
        let minprojection = (projections.length <= 0 ? 1 : projections[0].distanceData.distance);
        if (minprojection < 1) {
            // we need to start taking rails
            for (let i = 0; i < projections.length; i++) {
                if (projections[i].distanceData.distance - minprojection < 0.03) { // this is a HYPERPARAMETER
                    railstomodify.push(projections[i]);
                }
            }
        }

        // when we go through railstomodify, we need to be a bit careful... NOT!
        player.positionstep(framenum, minprojection - 0.0001); // also a HYPERPARAMETER
        player.velocitystep(framenum);
        for (let { rail, playerPoint, distanceData } of railstomodify) {
            rail.modifyVelocities(player, framenum, distanceData, input);
            //  a velocity vector will only be modified if it looks like it will encourage collision with that part of the rail
        }
        // step 4: increment positions and add the gravity vector for next timestep
        player.render(ctx, framenum);
        }
        catch (e) {
            logErr(e)
        }
    }
}