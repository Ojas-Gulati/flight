let gravity = 10;
let FPS = 60;

let gravAccVector = new Vector2(0, 0 - (gravity / FPS));

class PhysicsObject {
    constructor(mass) {
        this.position = new Vector2(0, 50);

        this.lastCheckpoint = null;
        this.killedFrame = -10000;
        this.deathanimationframes = 40;

        this.velocity = new Vector2(0, 0);
        this.nextGravity = new Vector2().copy(gravAccVector);
        this.hitboxX = 10;
        this.hitboxY = 20;
        this.crouchedHitboxY = 10;
        this.railstomodify = [];

        this.defaultHitboxPoints = [new Vector2(- this.hitboxX / 2, - this.hitboxY / 2), new Vector2(this.hitboxX / 2, - this.hitboxY / 2),
        new Vector2(this.hitboxX / 2, this.hitboxY / 2), new Vector2(- this.hitboxX / 2, this.hitboxY / 2)];

        this.crouchedHitboxPoints = [new Vector2(- this.hitboxX / 2, - this.crouchedHitboxY / 2), new Vector2(this.hitboxX / 2, - this.crouchedHitboxY / 2),
        new Vector2(this.hitboxX / 2, this.crouchedHitboxY / 2), new Vector2(- this.hitboxX / 2, this.crouchedHitboxY / 2)];

        this.hitboxPoints = this.defaultHitboxPoints;
        orderShape(this.hitboxPoints);
        this.hitboxPointsToReturn = [new Vector2(), new Vector2(), new Vector2(), new Vector2()];

        this.lines = [];
        this.velSteps = [];

        this.mass = mass;
        this.readyForWallJump = [false, false];
        this.wallJumpForbidden = [false, false];
        this.wjWindow = false;
    }
    render(ctx, framenum) {
        if ((framenum - this.killedFrame) <= this.deathanimationframes) {
            this.position.copy(this.lastCheckpoint);
        }
    }
    velocitystep(framenum, input) {
        this.velocity.add(this.nextGravity);    // the velocity increment is done first
    }
    modifyVelForInput(input) {
        let anyinput = false;
        let jumpHeight = 0;
        let movefactor = 1.3;
        let movefactorChanged = false;
        let friction = 1;
        let staticFriction = 0;
        // let staticFrictionIntroduction = 0;

        for (let inputKey of ["ArrowUp", "ArrowLeft", "ArrowRight"]) {
            anyinput = anyinput || input[inputKey];
        }

        let haveJumpingContactPointBelow = false;
        for (let lineData of this.lines) {
            let postoconpoint = new Vector2().subVectors(lineData.contactpoint, this.position)
            let complength = findComponentLength(postoconpoint, this.nextGravity);
            if (complength > 0 && gradient(lineData.line) < 0.5) {   // diamond angle
                haveJumpingContactPointBelow = true;
                if (lineData.jumpHeight > jumpHeight) {
                    jumpHeight = lineData.jumpHeight;
                }
            }

            if (lineData.movefactor < movefactor && movefactorChanged == false) {
                movefactor = lineData.movefactor;
                movefactorChanged = true;
            }
            if (lineData.movefactor >= movefactor) {
                movefactor = lineData.movefactor;
                movefactorChanged = true;
            }
            if (lineData.friction < friction) {
                friction = lineData.friction
            }
            if (lineData.staticFriction > staticFriction) {
                staticFriction = lineData.staticFriction;
            }
        }
        let inputVec = null;
        if (input.ArrowLeft) {
            inputVec = new Vector2(-1, 0);
        }
        if (input.ArrowRight) {
            inputVec = new Vector2(1, 0);
        }

        if (input.ArrowUp && haveJumpingContactPointBelow) {
            // find the upwards component of the vector and bump it to a maximum
            accelerateComponent(this.velocity, this.nextGravity.clone().multiplyScalar(-1), jumpHeight, 1);
        }
        else {
            //console.log(this.readyForWallJump, this.wjWindow);
            if ((this.readyForWallJump[0] == true && this.readyForWallJump[1] == false) || this.wjWindow) {
                if (inputVec != null && !this.wallJumpForbidden[0] && !this.wallJumpForbidden[1]) {
                    // accelerate
                    //  console.log("jumping")
                    let wjivec = inputVec.clone().multiplyScalar(2);
                    if (input.ArrowUp) {
                        wjivec.add(new Vector2(0, 10));
                    }
                    accelerateComponent(this.velocity, wjivec, 0.6 * wjivec.length(), 1);
                }
                else if (this.wjWindow != true) {
                    this.wjWindow = true;
                }
            }
        }

        if (inputVec != null) {
            accelerateComponent(this.velocity, inputVec, movefactor, 0.2); // HYPERPARAM
        }
        if (input.ArrowDown) {
            // this.hitboxPoints = this.crouchedHitboxPoints; // this hitbox is fine so dw // TODO: crouching is hard
        }
        else {
            // TODO: check if the hitbox modification will cause a collision and try to expand if possible, otherwise dont
            this.hitboxPoints = this.defaultHitboxPoints;
        }

        this.velocity.multiplyScalar(friction);
        let vellen = this.velocity.length();
        if (!anyinput) {
            this.velocity.sub(this.velocity.clone().setLength(Math.min(vellen, staticFriction)))
        }
        // if (haveJumpingContactPointBelow && !(anyinput)) {
        //     player.velocity.x = 0;
        //     player.velocity.y = 0;
        // }

        // ctx.strokeStyle = "green"
        // ctx.lineWidth = 5;
        // ctx.beginPath();
        // ctx.moveTo(player.position.x, player.position.y);
        // ctx.lineTo(player.position.x + (player.velocity.x * 20), player.position.y + (player.velocity.y * 20));
        // ctx.stroke();
        // TODO: all of the line things all need up down modification
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
    resetForTimestep() {
        this.lines = [];
        this.velSteps = [];
        this.readyForWallJump = [this.readyForWallJump[1], false];
        this.wallJumpForbidden = [this.wallJumpForbidden[1], false];
        this.wjWindow = false;
    }
    kill(framenum) {
        // the kill animation is:
        // 1. particles where the player died
        // 2. simultaneously, respawn the player. 0.25s freeze for a respawn animation
        // 3. continue as normal
        let deathpos = this.position.clone();
        this.position.copy(this.lastCheckpoint);
        this.velocity.copy(zerovec);
        if ((framenum - this.killedFrame) > this.deathanimationframes) {
            this.killedFrame = framenum;
            return deathpos;
        }
        else {
            return null;
        }
    }
}

const completionFrames = 60;
class Player extends PhysicsObject {
    constructor(mass) {
        super(mass);
        this.createHitboxPoints();
        this.movementRectangles = [];
        this.deathSquares = [];
        this.completionPos;
        this.completedLevelFrame = Infinity;
        this.stars;
    }
    render(ctx, framenum) {
        super.render(ctx, framenum)

        if (framenum - this.completedLevelFrame > 0) {
            // freeze position
            this.position.copy(this.completionPos);
            this.createHitboxPoints();
            this.velocity.copy(zerovec);
        }

        for (let i = 0; i < this.deathSquares.length; i++) {
            let square = this.deathSquares[i];
            let age = (framenum - square.created);
            if (age > square.lifetime) {
                this.deathSquares.splice(i, 1);
                i--;
            }
            else {
                // step the pos first
                square.pos.add(square.vel);
                square.vel.add(gravAccVector);
                const sideover2 = 1.5
                ctx.rect(square.pos.x - sideover2, square.pos.y - sideover2,
                    2 * sideover2, 2 * sideover2);
                ctx.fillStyle = "rgba(255, 0, 0, " + (1 - (age / square.lifetime)) + ")";
                ctx.fill();
            }
        }

        let deathtimer = (framenum - this.killedFrame);
        //if (false) {
        if (deathtimer <= this.deathanimationframes) {
            this.position.copy(this.lastCheckpoint);
            this.velocity.copy(zerovec);
            // do our death animation
            // this animation is in two parts. first, we draw the edges, then we fill the center
            const startmul = 0.3;
            const endmul = 0.7;
            let halvetiming = Math.min((deathtimer / this.deathanimationframes) / startmul, 1);
            ctx.lineWidth = 1;
            ctx.strokeStyle = "red";
            ctx.beginPath();
            ctx.moveTo(...this.hitboxPointsToReturn[0].toArray());
            let lim = (this.hitboxPointsToReturn.length + 1) * halvetiming;
            for (let i = 0; i < lim; i++) {
                ctx.lineTo(...this.hitboxPointsToReturn[i % this.hitboxPointsToReturn.length].toArray());
                if ((i + 1) > lim) {
                    let dist = (lim - i);
                    let coord = new Vector2().addVectors(
                        this.hitboxPointsToReturn[i % this.hitboxPointsToReturn.length].clone().multiplyScalar(1 - dist),
                        this.hitboxPointsToReturn[(i + 1) % this.hitboxPointsToReturn.length].clone().multiplyScalar(dist)
                    );
                    ctx.lineTo(...coord.toArray());
                }
            }
            ctx.stroke();

            if ((deathtimer / this.deathanimationframes) > endmul)
            {
                let halvetiming = ((deathtimer / this.deathanimationframes) - endmul) / (1 - endmul);
                ctx.beginPath();
                ctx.moveTo(...this.hitboxPointsToReturn[0].toArray());
                for (let i = 0; i < this.hitboxPointsToReturn.length; i++) {
                    ctx.lineTo(...this.hitboxPointsToReturn[i].toArray());
                }
                ctx.fillStyle = "rgba(255, 0, 0, " + halvetiming + ")";
                ctx.fill();
            }
        }
        else {
            ctx.fillStyle = "red";
            ctx.beginPath();
            ctx.moveTo(...this.hitboxPointsToReturn[0].toArray());
            for (let i = 0; i < this.hitboxPointsToReturn.length; i++) {
                ctx.lineTo(...this.hitboxPointsToReturn[i].toArray());
            }
            ctx.fill();

            // PARAMS
            let startingVel = 4;
            let maxVel = 6;
            let maxProb = 0.7;
            let cProb = Math.min(((this.velocity.length() - startingVel) / (maxVel - startingVel)) * maxProb, maxProb);

            if (Math.random() < cProb) {
                // create a new rectangle
                //console.log(this.velocity);
                //console.log(this.velocity.clone().multiplyScalar(-1));
                //-(0.5 + (Math.random() / 2)
                this.movementRectangles.push({
                    "position": this.position.clone().add(new Vector2(this.velocity.y, -this.velocity.x).setLength(1).multiplyScalar((0.5 - Math.random()) * this.hitboxX / 1)),
                    "direction": this.velocity.clone().multiplyScalar(-(0.5 + (Math.random() / 2))),
                    "width": Math.random() * this.hitboxX / 4,
                    "height": (5 + (cProb * this.hitboxY * Math.random() * 2)) / 4,
                    "lifetime": Math.random() * 20,
                    "created": framenum
                })
            }

            let timingFunc = (x_calc) => {
                // lagrange's formula
                // return x_calc;
                let coords = [
                    [0.93, 0.4],
                    [0.55, 0.93],
                    [0, 0],
                    [1, 0]
                ]
                let x = (n) => {
                    return coords[n][0]
                }
                let y = (n) => {
                    return coords[n][1]
                }
                let p_n = (x_in, n) => {
                    let prod = 1;
                    for (let i = 0; i < coords.length; i++) {
                        if (i != n) {
                            prod *= (x_in - x(i))
                        }
                    }
                    return prod;
                }
                let sum = 0;
                for (let i = 0; i < coords.length; i++) {
                    sum += p_n(x_calc, i) * (y(i) / p_n(x(i), i));
                }
                return sum;
            }
            //console.log(this.movementRectangles.length);
            for (let i = 0; i < this.movementRectangles.length; i++) {
                let rect = this.movementRectangles[i];
                if (framenum > (rect.created + rect.lifetime)) {
                    // kill it
                    this.movementRectangles.splice(i, 1);
                    i -= 1;
                }
                else {
                    // render it
                    // calculate corners
                    let percent = (framenum - rect.created) / rect.lifetime;
                    let centerpos = rect.position.clone().add(rect.direction.clone().multiplyScalar(percent));
                    let dirNormal = new Vector2(rect.direction.y, - rect.direction.x)
                    let height = rect.height * timingFunc(percent) * 1;
                    let width = rect.width;
                    let corners = [
                        centerpos.clone().add(rect.direction.clone().setLength(height * 2)).add(dirNormal.clone().setLength(width)),
                        centerpos.clone().add(rect.direction.clone().setLength(height * 2)).add(dirNormal.clone().setLength(width).multiplyScalar(-1)),
                        centerpos.clone().add(rect.direction.clone().setLength(height).multiplyScalar(0)).add(dirNormal.clone().setLength(width).multiplyScalar(-1)),
                        centerpos.clone().add(rect.direction.clone().setLength(height).multiplyScalar(0)).add(dirNormal.clone().setLength(width))
                    ]
                    //console.log(corners);
                    ctx.beginPath();
                    ctx.strokeStyle = "#FF0000";
                    ctx.lineWidth = 1;
                    ctx.moveTo(...corners[0].toArray());
                    ctx.lineTo(...corners[1].toArray());
                    ctx.lineTo(...corners[2].toArray());
                    ctx.lineTo(...corners[3].toArray());
                    ctx.lineTo(...corners[0].toArray()); // TODO: forgive me, for i have sinned
                    ctx.stroke();
                }
            }
            // movement threshold
            // create movement trails
        }

        let completedProg = framenum - this.completedLevelFrame;
        if (completedProg > 0) {
            // draw green circle
            // i can't be bothered to make this too good
            // fuck it, let's just fade the player to green and make them smaller
            ctx.fillStyle = "hsl(" + (120 * Math.min((completedProg / completionFrames), 1)) + ", 100%, 50%)";
            ctx.beginPath();
            ctx.moveTo(...this.hitboxPointsToReturn[0].toArray());
            for (let i = 0; i < this.hitboxPointsToReturn.length; i++) {
                ctx.lineTo(...this.hitboxPointsToReturn[i].toArray());
            }
            ctx.fill();
        }
        if (completedProg > completionFrames) {
            this.completionCallback(framenum, this.stars);
            console.log("called");
            this.completionCallback = () => {};
        }
    }
    kill(framenum) {
        let deathpos = super.kill(framenum);
        if (deathpos !== null) {
            // spawn in death squares
            const squarecount = 7;
            for (let i = 0; i < squarecount; i++) {
                let velocity = new Vector2(0, 1.5).rotateAround(new Vector2(0, 0), (Math.random() - 0.5) * 3);
                this.deathSquares.push({
                    pos: deathpos.clone(),
                    vel: velocity,
                    created: framenum,
                    lifetime: this.deathanimationframes + randomint(0, 30)
                })
            }
        }
    }
    levelComplete(framenum, stars, callback) {
        this.stars = stars;
        this.completedLevelFrame = framenum;
        this.completionCallback = callback;
        this.completionPos = this.position.clone();
    }
}