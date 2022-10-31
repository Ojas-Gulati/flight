log("test3");

let gravity = 10;
let FPS = 60;

let gravAccVector = new Vector2(0, 0 - (gravity / FPS));

log("levle");

class PhysicsObject {
    constructor(mass) {
        this.position = new Vector2(0, 50);
        this.lastpos = new Vector2().copy(this.position);   // this is to prevent clipping
        this.velocity = new Vector2(0, 0);
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
        this.velocity.add(gravAccVector);    // the velocity increment is done first
    }
    positionstep(framenum) {
        this.lastpos.copy(this.position);
        this.position.add(this.velocity);
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
    constructor() {}
    render(ctx, framenum) {
        // draw this object in the space [THIRD]
    }
    hitbox(player, framenum, input) {
        // this is a hitbox - if the player is in the hitbox, the player will be interacted SECOND
    }
    timestep(framenum) {
        // update internal properties for a render FIRST in a timestep
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
    hitbox(player, framenum, input) {}
}

class Rail {
    constructor(points, types = { "collision": true }, options = {}) {
        // for now, rails are groups of straight lines, 1px wide
        // these lines MUST GO FROM LEFT TO RIGHT
        // during interactions, objects can try to find nearest rails, what part of the rail they're nearest to and perform clampings based on this (for walking)
        // when arrow key inputs on a object clamped to a rail, we can perform movement on that rail by using the rail's gradient to set an appropriate velocity vector
        // so if running into a slope, the gradient will apply an upwards/to the right velocity
        // this allows for this momentum to carry on a jump

        // if the rail is slippery, we can tell it to calculate the acceleration due to gravity, factoring its slope directly.
        // infact, it may be possible to make this entirely out of rails, but if the rail code is complete, it's easily extendable.
        
        this.points = points;
        this.types = types;
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
        return [mindistance, minP, nearest];
    }
    distanceFromPlayer(player) {
        let distancedata = [Infinity]
        let idx = -1;
        for (let i = 0; i < player.hitboxPointsToReturn.length; i++) {
            let pointtomove = player.hitboxPointsToReturn[i];
            let cDD = this.distance(pointtomove);
            if (cDD[0] < distancedata[0]) {
                distancedata = cDD;
                idx = i;
            }
        }
        return [idx, distancedata];
    }
    unclamp() {
        this.clampeds = [];
    }
    clamp(player, input, force = False) {
        // this will take the point of the player nearest to the line, check if it should be clamped and put it on the line through the shortest distance
        // returning true if it decides to clamp
        // and also apply gradiential velocity vectors based on the player's input
        // to do this, use direct logic based on the direction and gradient
        // if force, will clamp regardless of distance
        
        // step 1: find the nearest point
        let [idx, distancedata] = this.distanceFromPlayer(player);
        if (distancedata[0] < 1 || force) {
            let pointtomove = player.hitboxPointsToReturn[idx];
            let pointtomoveto = distancedata[2];
            let adjustmentV = new Vector2().copy(player.position).sub(pointtomove)
            // player.position.addVectors(pointtomoveto, adjustmentV);
            // to complete, project the velocity vector onto this line
            let linevec = new Vector2().subVectors(this.points[distancedata[1] + 1], this.points[distancedata[1]]);
            player.velocity.copy(projectoline(player.velocity, [new Vector2(), linevec]))
        }
    }
}

class Wall extends Block {
    constructor(points) {
        super(points);
        // over here, all rails will be initiated to the edges formed by the points array
        // then, railtypes will provide what railtypes the rails will be initiated to
        this.rails = [];
        for (let i = 0; i < points.length - 1; i++) {
            this.rails.push(new Rail([points[i], points[i + 1]]));
        }
    }
    hitbox(player, framenum, input) {
        let intersecting = false;
        if (intersects(player.createHitboxPoints(), this.points)) {
            intersecting = true;
        }
        // now we need rails
        // whichever rail we're closest to we clamp to
        let nearest = [Infinity];
        let nearestidx = -1;
        for (let i = 0; i < this.rails.length; i++) {
            let rail = this.rails[i];
            let cdd = rail.distanceFromPlayer(player)[1];
            if (cdd[0] < nearest[0]) {
                nearest = cdd;
                nearestidx = i;
            }
        }
        // now, clamp!
        this.rails[nearestidx].clamp(player, input, intersecting)
        // finally, if we're still intersecting, apply a sort of "repulsion" positional adjustment to get the player out
        // essentially, whatever side of the player is still intersecting will get a "snap" pixel adjustment
        
        if (intersects(player.createHitboxPoints(), this.points)) {
            player.position.y += 1;
            // TODO: or not? ideally this separate method should prevent the problem
        }
    }
}

// rails are cool, but lets redesign this
// step 1: each timestep, add a function applyVeloc to allow objects to apply velocity vectors onto the player (e.g. speed boosts)
// step 2: when we step the player, go through every single object and all of their collision rails
//          look at the velocity vector and see what % of the velocity vector we can go through before having to stop
// step 3: if there is some rail that limits this % to < 1, find the most limiting (smallest %) rail(s) and make that the rail that the player is clamped to
//          this will allow the rail to project velocity vectors and handle inputs for the next timestep
// step 3.5: allow clamped rails to modify velocities
// step 4: increment positions

class Level {
    constructor(objects) {
        this.objects = objects;
        this.camera = new Vector2(0, 0); // the camera is what is in the center of the screen
    }
    timestep(player, ctx, canvas, framenum) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.setTransform(1, 0, 0, -1, canvas.width / 2 - this.camera.x, canvas.height / 2 + this.camera.y);
        try {
        player.velocitystep(framenum);
        player.createHitboxPoints();
        for (let obj of this.objects) {
            obj.timestep(framenum)
            obj.hitbox(player, framenum);
            obj.render(ctx, framenum);
        }
        let percent = 1;
        for (let obj of this.objects) {
            percent = Math.min(obj.prevent
        }
        player.positionstep(framenum, percent);
        player.render(ctx, framenum);
        }
        catch (e) {
            logErr(e)
        }
    }
}