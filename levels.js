// let wallaccumulator = new Vector2(0, 0);

// let wall = new Wall([new Vector2(-50, -50), new Vector2(50, -70), new Vector2(70, -60), new Vector2(50, -85), new Vector2(-50, -60)], materials.wall);
// let wall2 = new Wall([new Vector2(-25, -165), new Vector2(110, -130), new Vector2(110, -20), new Vector2(150, -20), new Vector2(150, -140), new Vector2(-25, -175)], materials.wall);
// let wall3 = new Wall([new Vector2(-70, -50), new Vector2(-50, -40), new Vector2(-80, -200), new Vector2(-100, -175)], materials.wall);
// let wall4 = new Wall([new Vector2(-80, -260), new Vector2(100, -300), new Vector2(100, -310), new Vector2(-100, -260)], materials.bouncepad)
// let mwall = new movingWall([new Vector2(-200, -200), new Vector2(-100, -200), new Vector2(-100, -210), new Vector2(-200, -210)], (framenum) => {
//     let timestepVec = new Vector2(0, 0);
//     if ((framenum % 500) > 180 && (framenum % 500) < 190) {
//         timestepVec = new Vector2(-10, 10);
//     }
//     if ((framenum % 500) > 370 && (framenum % 500) < 380) {
//         timestepVec = new Vector2(10, -10);
//     }
//     wallaccumulator.add(timestepVec);
//     return wallaccumulator;
// }, materials.ice)
// let spikes = makeSpikes(new Vector2(-100, 100), new Vector2(-200, 100), 10)
// let level_test = new Level([wall, wall2, wall3, wall4, mwall, spikes], [new Vector2(0, 0), new Vector2(-50, 0), new Vector2(100, -100)], [
//     [new Vector2(0, 0), [new Vector2(-1000, 1000), new Vector2(1000, -150)], 1],
//     [new Vector2(100, -150), null, 0.8]
// ]);

function makeObjects(svgid) {
    let objects = [];
    let runningPointsCollection = [];
    let paths = $("#" + svgid + " path").get();
    for (let obj of paths) {
        // get our data string
        let dString = obj.getAttribute("d");
        let color = window.getComputedStyle(obj)["fill"]
        const colorToMaterial = {
            "rgb(114, 229, 247)": "ice",
            "rgb(0, 0, 0)": "wall",
            "rgb(255, 0, 0)": "spikes",
            "rgb(84, 104, 255)": "bouncepad",
            "rgb(255, 112, 109)": "killzone"
        }
        let materialName = colorToMaterial[color] ?? "wall";
        let materialData = materials[materialName];
        // now make it into points
        let commands = makeAbsolute(parseSVG(dString));
        // now go through these
        runningPointsCollection.push([]);
        let runningPoints = runningPointsCollection[runningPointsCollection.length - 1];
        for (let i = 0; i < commands.length; i++) {
            let currCommand = commands[i];
            if (currCommand.command == "closepath") { }
            else {
                // store the end coord
                runningPoints.push(new Vector2(currCommand.x, 0 - currCommand.y));
            }
            if (currCommand.command == "moveto" || i == (commands.length - 1)) {
                // add the current path
                if (runningPoints.length > 1) {
                    if (materialName == "spikes") {
                        for (let k = 1; k < runningPoints.length; k++) {
                            objects.push(makeSpikes(runningPoints[k - 1], runningPoints[k], 10));
                        }
                    }
                    else {
                        objects.push(new Wall(runningPoints, materialData))
                    }
                }
            }
            // if (currCommand.command == "moveto") {
            //     // store one more point
            //     runningPoints.push(new Vector2(currCommand.x0, currCommand.y0));
            // }
        }
    }
    return objects;
}

// function makeLevel1() {
//     let objects = makeObjects("#level1SVG");
//     console.log(objects);
//     // objects.push(makeSpikes(new Vector2(45.1, 41.5), new Vector2(103.7, 41.5), -10));
//     return new Level(objects, [new Vector2(-80, 20), new Vector2(600, -200)], [
//         [new Vector2(450, -100), null, 0.8]
//     ])
//     // let mkLeft = -400;
//     // let mk1 = 20;
//     // let mk2 = 80;
//     // let mkTop = 0;
//     // let mkRight = 200;
//     // let mkheight = -30;

//     // let objects = [];
//     // objects.push(new Wall([new Vector2(mkLeft, mkTop), new Vector2(mk1, mkTop), new Vector2(mk1, mkheight), new Vector2(mkLeft, mkheight)], materials.wall));
//     // objects.push(new Wall([new Vector2(mk2, mkTop), new Vector2(mkRight, mkTop), new Vector2(mkRight, mkheight), new Vector2(mk2, mkheight)], materials.ice));
//     // //objects.push(makeSpikes(new Vector2(-50, mkTop), new Vector2(0, mkTop), 10));

//     // return new Level(objects, [new Vector2(-80, 20)], [
//     //     [new Vector2(100, -200), null, 1.3]
//     // ])
// }