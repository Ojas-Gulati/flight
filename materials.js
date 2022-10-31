// function makepattern(obj) {
//     return new Promise((resolve, reject) => {
//         obj.onload = () => {
//             var pattern = ctx.createPattern(obj, "repeat");
//             resolve(pattern)
//         };
//         obj.onerror = reject;
//     });
// }

// let ice = new Image();
// ice.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwBAMAAAClLOS0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAGUExURXLl9y+MyV6X3zoAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABySURBVDjLzZMxDsAgDAOdH4T/f7aYFFVqPdRRhzJAzA0XhALEmAtgMbeRYGRtA14n6oo5GFm3gBCUwwVKQOwDKWiDp6DENvhhS5vdBTE6QAn2yz3wWUvrEIJzPjwgBXsMTCAFNQYmkIIVbSAF13+8BokDRm8mQdnLe2EAAAAASUVORK5CYII=';
// let icepromise = makepattern(ice); // see comment of T S why you should do it this way.

function makeColorRenderer(color) {
    function render(ctx, framenum) {
        ctx.lineWidth = this.width;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(...this.points[0].toArray());
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(...this.points[i].toArray())
        }

        ctx.fill();
    }
    return render;
}

// function makeImageRenderer(imagepromise) {
//     async function render(ctx, framenum) {
//         ctx.lineWidth = 2;
//         ctx.fillStyle = await imagepromise;
//         ctx.beginPath();
//         ctx.moveTo(...this.points[0].toArray());
//         for (let i = 1; i < this.points.length; i++) {
//             ctx.lineTo(...this.points[i].toArray())
//         }
//         ctx.fill();
//     }
//     return render; // TODO: WARNING: this does not work.
// }

function makeSpikes(startpoint, endpoint, height, maxspacing = 12) {
    // step 1: calculate a bounding box & spike structure
    let linevec = new Vector2().subVectors(endpoint, startpoint); // spikes go CCW
    let perpvec = linevec.clone().rotateAround(zerovec, Math.PI / 2);
    perpvec.multiplyScalar(height / perpvec.length());
    let spikecount = Math.ceil(linevec.length() / maxspacing);
    let firstspike = startpoint.clone().add(perpvec).add(linevec.clone().multiplyScalar(1 / (spikecount * 2)))
    
    let boundingbox = [startpoint, endpoint, firstspike.clone().add(linevec.clone().multiplyScalar((spikecount - 1) / spikecount)), firstspike]
    let rfunc = (ctx, framenum) => {
        ctx.beginPath();
        ctx.moveTo(...startpoint.toArray());
        for (let i = 0; i < spikecount; i++) {
            ctx.lineTo(...firstspike.clone().add(linevec.clone().multiplyScalar(i / spikecount)).toArray())
            ctx.lineTo(...startpoint.clone().add(linevec.clone().multiplyScalar((i + 1) / spikecount)).toArray())
        }
        ctx.lineTo(...startpoint.toArray());
        ctx.fillStyle = "#FF706D";
        ctx.fill();

        ctx.fillStyle = "rgba(255, 0, 0, 0.05)";
        ctx.beginPath();
        ctx.moveTo(...boundingbox[0].toArray());
        for (let i = 1; i < boundingbox.length; i++) {
            ctx.lineTo(...boundingbox[i].toArray())
        }

        ctx.fill();
    }

    return new Wall(boundingbox, { killPlayer: true, renderfunc: rfunc })
}

let materials = {
    wall: {
        renderfunc: makeColorRenderer("black"),
        jumpheight: 3.5
    },
    ice: {
        renderfunc: makeColorRenderer("#72E5F7"),
        frictionmul: 1,
        movefactor: 1.5,
        jumpheight: 3.5,
        staticFriction: 0,
        walljump: false
    },
    killzone: {
        renderfunc: makeColorRenderer("#FF706D"),
        killPlayer: true
    },
    bouncepad: {
        renderfunc: makeColorRenderer("#5468FF"),
        frictionmul: 0.8,
        movefactor: 1.5,
        jumpheight: 4,
        staticFriction: 0.1,
        walljump: true,
        restitution: 1.3
    }
};