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
    stepForMovement(player, framenum) {
    }
}

class Rail {
    constructor(points, options = {}) {
        // for now, rails are groups of straight lines, 1px wide
        // these points MUST BE CLOCKWISE
        // during interactions, objects can try to find nearest rails, what part of the rail they're nearest to and perform clampings based on this (for walking)
        // when arrow key inputs on a object clamped to a rail, we can perform movement on that rail by using the rail's gradient to set an appropriate velocity vector
        // so if running into a slope, the gradient will apply an upwards/to the right velocity
        // this allows for this momentum to carry on a jump

        // if the rail is slippery, we can tell it to calculate the acceleration due to gravity, factoring its slope directly.
        // infact, it may be possible to make this entirely out of rails, but if the rail code is complete, it's easily extendable.

        this.frictionMul = options.frictionmul ?? 1;
        this.movefactor = options.movefactor ?? 2.2;
        this.jumpHeight = options.jumpHeight ?? 4;
        this.staticFriction = options.staticFriction ?? 0.1;
        this.killPlayer = options.killPlayer ?? false;
        this.restitution = options.restitution ?? 0;
        let dir = new Vector2().subVectors(points[1], points[0]);
        let normal = dir.clone().rotateAround(new Vector2(), (Math.PI / 2))
        if (dir.x < 0) dir.x = - dir.x;
        if (dir.y < 0) dir.y = - dir.y;
        this.walljump = (this.staticFriction > 0.05 && dir.taxicabAngle() > 0.9 && dir.length() > 20 && (normal.taxicabAngle() > 1.9 || normal.taxicabAngle() < 0.1)) && (options.walljump ?? true); // HYPERPARAMS
        if (this.walljump) this.staticFriction = 0;
        this.points = points;
        this.accessedTimestep = -1;
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
            "linevec": new Vector2().subVectors(this.points[minP + 1], this.points[minP])
        };
    }
    modifyVelocities(player, framenum, distanceData, clamp, input) {
        // ONLY ADJUST A VELOCITY VECTOR IF IT ENCOURAGES COLLISION
        // in other words, use polygon winding numbers to calculate interiors
        // if a velocity threatens to breach through this rail into an interior, kill it
        // otherwise ignore

        // so now we know that rotating the rail 90 CCW will get us to the interior
        // we can take the linevec and make it so that we
        if (this.accessedTimestep != framenum || true) {
            let calculatedStatic = this.staticFriction;
            // if (this.walljump && this.)
            this.accessedTimestep = framenum;
            let keypressed = false;
            for (let val in input) {
                keypressed = keypressed || input[val];
            }
            let point = distanceData.linestart;
            let linevec = distanceData.linevec;
            let normalInsideVec = linevec.clone().rotateAround(new Vector2(), (Math.PI / 2));

            if (this.walljump) {
                // check, is our input into the wall?
                let wjDist = 10;
                if (((input.ArrowLeft && findComponentLength(new Vector2(-1, 0), normalInsideVec) > 0) ||
                    (input.ArrowRight && findComponentLength(new Vector2(1, 0), normalInsideVec) > 0)
                )) {
                    // apply a friction
                    if (player.velocity.length() > 0.7) {
                        player.velocity.multiplyScalar(0.9)
                    }
                    player.readyForWallJump[player.readyForWallJump.length - 1] = true;
                    if (!(new Vector2().subVectors(distanceData.nearestP, this.points[0]).length() > wjDist && new Vector2().subVectors(distanceData.nearestP, this.points[1]).length() > wjDist)) {
                        player.wallJumpForbidden[player.wallJumpForbidden.length - 1] = true;
                    }
                }
            }

            if (clamp) {
                // let linevec = distanceData.projTo;
                if (encouragingCollision(linevec, player.velocity)) {
                    // add a little bit of monika
                    //console.log(player.velocity);
                    let perpcomponent = findComponentLength(player.velocity, normalInsideVec);
                    //console.log(perpcomponent);
                    player.velocity = projectoline(player.velocity, [new Vector2(), linevec]).sub(normalInsideVec.clone().setLength(perpcomponent * this.restitution));
                    //console.log(player.velocity)
                    // HYPERP
                }
                if (findComponentLength(player.velocity, normalInsideVec) > -0.000000000000001) player.velocity.sub(normalInsideVec.clone().setLength(0.00001)); // TODO: add a normal
                player.lines.push({
                    "line": linevec,
                    "contactpoint": distanceData.nearestP,
                    "friction": this.frictionMul,
                    "movefactor": this.movefactor,
                    "jumpHeight": this.jumpHeight,
                    "staticFriction": calculatedStatic
                });
                if (this.killPlayer) {
                    // just kill on contact
                    player.kill(framenum);
                }
            }
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

let railinteractiondist = 0.1
let railclampdist = 0.01 // HYPERPARAMETER
class Wall extends Block {
    constructor(points, options = {}) {
        super(points);
        this.options = options;
        orderShape(points);

        this.rails = [];
        for (let i = 0; i < points.length; i++) {
            this.rails.push(new Rail([points[i], points[(i + 1) % points.length]], options));
        }

        if (options.renderfunc != undefined) {
            this.render = options.renderfunc;
        }
    }
    projectMovement(player) {
        // return the rails that we're on a collision course with
        // TODO: if a small angle adjustment will prevent collision, make it
        let revVelocity = player.velocity.clone().multiplyScalar(-1);
        let railcols = [];
        for (let rail of this.rails) {
            railcols.push(...projectForCollision(player.hitboxPointsToReturn, rail.points, player.velocity, true, false).map((x) => { x.rail = rail; x.clamp = true; return x }));
        }
        railcols.sort((a, b) => a.distanceData.distance - b.distanceData.distance);
        if (railcols.length == 0) return [];
        return [railcols[0]];
    }
    closestRails(player) {
        // only return the rails close enough to interact with
        let closestrails = [];
        for (let point of player.hitboxPointsToReturn) {
            for (let rail of this.rails) {
                let dist = rail.distance(point);
                if (dist.distance < railinteractiondist) { // HYPERPARAMETER
                    closestrails.push({
                        "rail": rail,
                        "playerPoint": point,
                        "distanceData": dist,
                        "clamp": (dist.distance < railclampdist)
                    });
                }
            }
        }
        closestrails.sort((a, b) => a.distanceData.distance - b.distanceData.distance);
        if (closestrails.length == 0) return [];
        return [closestrails[0]];   // TODO: this also needs to return the smallest couple
    }
}

function performMovementStep(levelobject, objects, framenum, log = false) {
    // step 2: when we step the player, go through every single object and all of their collision rails
    //          look at the velocity vector and see what % of the velocity vector we can go through before having to stop
    //          this is good as ziplines can see where the velocity vector is coming from before forcing a collision
    let projections = []; // this is an array of the projection distances and the rails limiting the interaction
    // contains the rail, nearest point, and point of the rail that this hits on
    let closestRails = [];
    for (let obj of objects) {
        projections.push(...obj.projectMovement(levelobject));
        closestRails.push(...obj.closestRails(levelobject))
    }

    projections.sort((a, b) => a.distanceData.distance - b.distanceData.distance);
    // now go through the limiting / smallest projections
    // step 3: if there is some rail that limits this % to < 1, find the most limiting (smallest %) rail(s) and make that the rail that the player is clamped to
    //          this will allow the rail to project velocity vectors and handle inputs for the next timestep
    //          in addition, allow very close rails to be clamped and do velocity vector modification
    // step 3.5: allow clamped rails to modify velocities
    levelobject.railstomodify = [...closestRails];
    let minprojection = (projections.length <= 0 ? 1 : projections[0].distanceData.distance);
    if (minprojection < 1) {
        // we need to start taking rails
        for (let i = 0; i < projections.length; i++) {
            if (projections[i].distanceData.distance - minprojection < 0.03) { // this is a HYPERPARAMETER
                levelobject.railstomodify.push(projections[i]);
            }
        }
    }
    if (log) {
        // console.log(JSON.stringify(levelobject.railstomodify));
        // console.log(minprojection);
    }

    // when we go through railstomodify, we need to be a bit careful... NOT!
    levelobject.positionstep(framenum, minprojection - 0.00001); // also a HYPERPARAMETER
    levelobject.createHitboxPoints();
}

class movingWall extends Wall {
    constructor(points, movementfunction, options) {
        super(points, options);
        this.pointsCopy = points.map((x) => x.clone())
        this.mfunc = movementfunction
        this.currpos = new Vector2(0, 0);
    }

    stepForMovement(player, framenum, objects, level, input) {
        // update all the rails
        let newpos = this.mfunc(framenum)
        let timestepVec = newpos.clone().sub(this.currpos); // TODO: prevent bouncing
        // console.log(timestepVec.x, timestepVec.y, newpos.x, newpos.y, this.currpos.x, this.currpos.y);
        this.currpos = newpos.clone();
        let tsveclen = timestepVec.length();

        // before we actually move, project for movement
        let done = false;

        for (let i = 0; i < 10; i++) {   // repeats is a hyperParam
            let projections = [];
            for (let rail of this.rails) {
                projections.push(...projectForCollision(rail.points, player.hitboxPointsToReturn, timestepVec, false, true).map((x) => { x.rail = rail; return x }));
            }
            projections.sort((a, b) => a.distanceData.distance - b.distanceData.distance);
            if (projections.length > 0) {
                if (projections[0].distanceData.distance <= 1) {
                    if (this.options.killPlayer) {
                        done = false;
                        break;
                    }
                    else {
                        // let mindist = projections[0].distanceData.distance;
                        // let targetveclen = (i <= 2 ? (1 - mindist) : 1) * tsveclen;
                        // // we can't do the full movement: transfer our difference velocity to the player and move it
                        // // TODO: ideally, we would apply a force normal to the linevec and parallel to the linevec depending on friction and components
                        // let complen = findComponentLength(player.velocity, timestepVec);
                        // let startPVel = player.velocity.clone();
                        // if (complen < targetveclen) {
                        //     player.velocity.add(timestepVec.clone().setLength((targetveclen) + 0.001));
                        // }

                        // here we need to:
                        // - calculate perpendicular component
                        let currRail = projections[0].rail

                        let startPVel = player.velocity.clone();

                        let linevec = projections[0].distanceData.linevec;
                        let normalInsideVec = linevec.clone().rotateAround(new Vector2(), (Math.PI / 2));

                        let tsveclenRailNormal = 0 - findComponentLength(timestepVec, normalInsideVec) // this is how large p velocity should be
                        let currentRailNormal = 0 - findComponentLength(startPVel, normalInsideVec) // this is how large it currently is
                        // console.log(tsveclenRailNormal, currentRailNormal);
                        let targetnormallength = currentRailNormal - tsveclenRailNormal;
                        if (targetnormallength > 0) {
                            // adjust for correctness
                            player.velocity.add(normalInsideVec.clone().setLength(targetnormallength))
                        }
                        else {
                            // we still aren't making it
                            // console.log("AAAAAAAAAAA");
                        }

                        let parallel_length = ((1 - currRail.frictionMul) + currRail.staticFriction) * findComponentLength(timestepVec, linevec);
                        let current_progress = findComponentLength(startPVel, linevec);
                        let targetparallellength = parallel_length - current_progress;

                        if ((parallel_length * current_progress < 0) || Math.abs(parallel_length) > Math.abs(current_progress)) {
                            player.velocity.add(linevec.clone().setLength(targetparallellength))
                        }

                        // console.log(player.velocity);
                        // performMovementStep(player, objects); // TODO: try and put the actual loop into this section??
                        // TMP
                        let func = (player, ctx, canvas, framenum, inputIn) => {
                            // console.log(inputIn)
                            //try {
                            // step 1: each timestep, add a function applyVeloc to allow objects to apply velocity vectors onto the player (e.g. speed boosts)
                            for (let { rail, playerPoint, distanceData, clamp } of player.railstomodify) {
                                rail.modifyVelocities(player, framenum, distanceData, clamp, inputIn);
                                //  a velocity vector will only be modified if it looks like it will encourage collision with that part of the rail
                            }
                            player.velocitystep(framenum, inputIn);
                            player.modifyVelForInput(inputIn);
                            player.resetForTimestep();
                            player.nextGravity.copy(gravAccVector);
                            // for (let obj of this.objects) {
                            //     obj.timestep(framenum);
                            //     obj.render(ctx, framenum);
                            // }
                            for (let obj of level.objects) {
                                obj.applyVeloc(player, framenum, inputIn);
                            }
                            performMovementStep(player, level.objects, framenum, true)
                        }
                        func(player, ctx, canvas, framenum, input);
                        // func(player, ctx, canvas, framenum, level.input);
                        //player.position.add(player.velocity.clone().multiplyScalar(1))
                        // player.velocity.copy(startPVel.add(timestepVec.clone().setLength((tsveclen - complen) + 0.001)))
                    }
                }
                else {
                    done = true;
                    break;
                }
            }
            else {
                done = true;
                break;
            }
        }

        if (!done) {
            player.kill(framenum);
        }
        for (let i = 0; i < this.points.length; i++) {
            this.points[i].x = this.pointsCopy[i].x + this.mfunc(framenum).x;
            this.points[i].y = this.pointsCopy[i].y + this.mfunc(framenum).y;
        }
        //console.log("E");
        //console.log(player.velocity);
    }
}

// rails are cool, but lets redesign this
// HYPERP
const cameramoveframes = 30;
const globalZoomScaling = 2;
class Level {
    constructor(objects, checkpoints, camera_settings, stars, lastCallback, completionCallback) {
        this.objects = objects;
        this.checkpoints = [];
        this.currCheckpoint = 0;
        this.camera_settings = camera_settings;
        this.prevCamera;
        this.prevzoom = 1;
        this.nextCamera;
        this.nextzoom = 1
        this.currentCameraProgress = cameramoveframes;
        this.camera; // the camera is what is in the center of the screen
        this.camerazoom = 1;
        this.completionCallback = completionCallback ?? (() => { })
        this.lastCallback = lastCallback ?? (() => { })
        this.stars = stars.map((val) => {
            return {
                "pos": val,
                "visited": false
            }
        })

        for (let i = 0; i < checkpoints.length; i++) {
            if (i == 0) {
                this.checkpoints.push({
                    "status": "current",
                    "pos": checkpoints[i],
                    "interactionFrames": 0
                })
            }
            else {
                this.checkpoints.push({
                    "status": "unvisited",
                    "pos": checkpoints[i],
                    "interactionFrames": 0
                })
            }
        }
    }
    init_player(player) {
        player.position = this.checkpoints[0].pos.clone();
        player.lastCheckpoint = this.checkpoints[0].pos.clone();
        let [currcam, currzoom] = findCamera(this.camera_settings, player.position)
        this.camera = currcam
        this.prevCamera = currcam
        this.nextCamera = currcam
        this.prevzoom = currzoom
        this.nextzoom = currzoom
        this.camerazoom = currzoom
    }
    timestep(player, ctx, canvas, framenum, input) {
        // recalculate camera
        let [currcam, currzoom] = findCamera(this.camera_settings, player.position)
        if (currcam != this.nextCamera || currzoom != this.nextzoom) {
            this.prevCamera = this.camera;
            this.nextCamera = currcam;
            this.prevzoom = this.camerazoom;
            this.nextzoom = currzoom
            this.currentCameraProgress = 1;
        }
        // step the camera towards the target
        this.camera = xplusky(this.prevCamera, cubic_timing(this.currentCameraProgress / cameramoveframes), new Vector2().subVectors(this.nextCamera, this.prevCamera));
        this.camerazoom = this.prevzoom + (cubic_timing(this.currentCameraProgress / cameramoveframes) * (this.nextzoom - this.prevzoom))
        if (this.currentCameraProgress < cameramoveframes) this.currentCameraProgress += 1;

        this.input = input; // TMP
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(this.camerazoom * globalZoomScaling, 0, 0, -this.camerazoom * globalZoomScaling, canvas.width / 2 - this.camera.x, canvas.height / 2 + this.camera.y);

        //try {
        // step 1: each timestep, add a function applyVeloc to allow objects to apply velocity vectors onto the player (e.g. speed boosts)
        let startpos = player.position.clone();
        //console.log(player.readyForWallJump)
        player.velocitystep(framenum, input);
        player.modifyVelForInput(input);
        player.resetForTimestep();
        for (let { rail, playerPoint, distanceData, clamp } of player.railstomodify) {
            rail.modifyVelocities(player, framenum, distanceData, clamp, input);
            //  a velocity vector will only be modified if it looks like it will encourage collision with that part of the rail
        }
        player.nextGravity.copy(gravAccVector);
        for (let obj of this.objects) {
            obj.timestep(framenum);
            obj.render(ctx, framenum);
        }

        // render checkpoints on top
        let renderCheckpoints = (ctx, checkpoints) => {
            let innerRotationFrames = 300;
            let radius = 6;
            let sides = 5;
            let outersides = 10;
            let outerradius = 10;
            let outerrotationframes = 20;
            let outerstrokewidth = 1.5;

            let animationFrames = 120;
            let outeranimatedradius = 14;

            let colorlookup = {
                "current": "#99FF32",
                "visited": "#FFD000",
                "unvisited": "#E50003"
            }

            for (let i = 0; i < checkpoints.length; i++) {
                let checkpoint = checkpoints[i];
                pathRegularPolygon(ctx, checkpoint.pos, checkpoint.pos.clone().add((new Vector2(radius, 0)).rotateAround(new Vector2(), Math.PI * 2 * ((framenum % innerRotationFrames) / innerRotationFrames))), sides)
                ctx.fillStyle = colorlookup[checkpoint.status];
                ctx.fill();

                for (let j = 0; j < outersides; j++) {
                    let offset = (((outerrotationframes - (framenum % outerrotationframes)) / (outerrotationframes * outersides)) * Math.PI * 2) + (Math.PI * j * (2 / outersides));
                    ctx.beginPath();
                    ctx.arc(checkpoint.pos.x, checkpoint.pos.y, outerradius + (cubicBounce(((framenum - checkpoint.interactionFrames) / animationFrames)) * (outeranimatedradius - outerradius)), offset, offset + (Math.PI * (1 / outersides)), false)
                    ctx.strokeStyle = colorlookup[checkpoint.status];
                    ctx.lineWidth = outerstrokewidth;
                    ctx.stroke();
                }
            }
        }
        let renderStars = (ctx, stars) => {
            for (let star of stars) {
                ctx.lineWidth = 1;
                ctx.strokeStyle = "#EDBD00";
                if (star.visited) {
                    ctx.fillStyle = "#FFE100";
                }
                else {
                    ctx.fillStyle = "rgba(255, 255, 255, 1)";
                }
                drawStar(star.pos.x, star.pos.y, 5, 10, 5)
            }
        }
        renderStars(ctx, this.stars);
        renderCheckpoints(ctx, this.checkpoints)

        for (let obj of this.objects) {
            obj.applyVeloc(player, framenum, input);
        }
        // step 4: increment positions and add the gravity vector for next timestep
        for (let obj of this.objects) {
            obj.stepForMovement(player, framenum, this.objects, this, input);
        }
        let prevpos = player.position.clone();
        let distance = performMovementStep(player, this.objects, framenum)
        let travelledVec = player.position.clone().sub(prevpos);
        // did the player travel over a checkpoint?
        for (let i = 0; i < this.checkpoints.length; i++) {
            let checkpoint = this.checkpoints[i];
            if (checkpoint.status != "current") {
                let data = projectForCollision(makeEpsilonSquare(checkpoint.pos, 5), player.hitboxPointsToReturn, travelledVec, true, true);
                if (data.length != 0) {
                    let clashing = false;
                    for (let dobj of data) {
                        if (dobj.distanceData.distance <= 1) {
                            clashing = true;
                            break;
                        }
                    }
                    if (clashing) {
                        // find the other current checkpoint
                        this.checkpoints[this.currCheckpoint].status = "visited";
                        this.currCheckpoint = i;
                        checkpoint.status = "current";
                        checkpoint.interactionFrames = framenum;
                        player.lastCheckpoint = this.checkpoints[this.currCheckpoint].pos;

                        if (i == this.checkpoints.length - 1) {
                            // we've finished the level
                            this.lastCallback();
                            player.levelComplete(framenum, this.stars, this.completionCallback); // trigger an animation, and have the levelRunner stop
                        }
                    }
                }
            }
        }
        for (let i = 0; i < this.stars.length; i++) {
            let star = this.stars[i];
            if (star.visited == false) {
                let data = projectForCollision(makeEpsilonSquare(star.pos, 5), player.hitboxPointsToReturn, travelledVec, true, true);
                if (data.length != 0) {
                    let clashing = false;
                    for (let dobj of data) {
                        if (dobj.distanceData.distance <= 1) {
                            clashing = true;
                            break;
                        }
                    }
                    if (clashing) {
                        star.visited = true;
                    }
                }
            }
        }

        //player.velocity.x = absmin(player.velocity.x, endpos.x - startpos.x);
        //player.velocity.y = absmin(player.velocity.y, endpos.y - startpos.y);
        //player.velocity.subVectors(endpos, startpos)
        player.render(ctx, framenum);
        // lag machine
        // for (let i = 0; i < 10; i++) {
        //    log("i");
        // }
        // }
        // catch (e) {
        //    logErr(e)
        // }
    }
}