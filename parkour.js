var stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
//document.body.appendChild(stats.dom);

let currLevelIdx = null;

let ingame = false;

function formattime(ms) {
    // hours, minutes, ms
    let minutesmul = 1000 * 60;
    let secondsmul = 1000;
    let minutes = (ms - (ms % minutesmul)) / minutesmul;
    let seconds = ((ms % minutesmul) - (ms % secondsmul)) / secondsmul;
    let millis = (ms % secondsmul)

    return `${minutes}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`
}

function toggleIngame(target) {
    ingame = target;
    if (ingame) {
        document.getElementById("gamecontrols").style.display = "none";
        document.getElementById("hud").style.display = "block";
        stats.dom.style.display = "block";
    }
    else {
        document.getElementById("gamecontrols").style.display = "block";
        document.getElementById("hud").style.display = "none";
        stats.dom.style.display = "none";
    }
    // toggle top right stuffs
}
toggleIngame(false);
console.log(makeRectanglePoints(new Vector2(-134, -147), new Vector2(96, -166)));
let levelAdditionalData = [
    {
        "id": "1",
        "extraObjects": [],
        "checkpoints": [new Vector2(-80, 20), new Vector2(600, -200)],
        "cameraData": [[new Vector2(450, -100), null, 0.8]],
        "stars": [new Vector2(300, 20)]
    },
    {
        "id": "2",
        "extraObjects": [
            new movingWall(makeRectanglePoints(new Vector2(-134, -167), new Vector2(80, -176)), makeTimingFunction({
                period: 2 * 60,
                nodes: [
                    [0, new Vector2(0, 0)],
                    [105, new Vector2(0, 0)],
                    [119, new Vector2(0, 100)]
                ],
                bounce: true,
                timing_func: linearTiming
            }), materials.wall),
            new movingWall(makeRectanglePoints(new Vector2(630, -9), new Vector2(680, 4)), makeTimingFunction({
                period: 60,
                nodes: [
                    [0, new Vector2(0, 0)],
                    [59, new Vector2(-300, 0)]
                ],
                bounce: true,
                timing_func: linearTiming
            }), materials.bouncepad),
            new movingWall(makeRectanglePoints(new Vector2(111, 90), new Vector2(131, 50)), makeTimingFunction({
                period: 40,
                nodes: [
                    [0, new Vector2(0, 0)],
                    [39, new Vector2(80, 0)]
                ],
                bounce: true,
                timing_func: linearTiming
            }), materials.killzone),
            new movingWall(makeRectanglePoints(new Vector2(191, 10), new Vector2(211, -30)), makeTimingFunction({
                period: 40,
                nodes: [
                    [0, new Vector2(0, 0)],
                    [39, new Vector2(-80, 0)]
                ],
                bounce: true,
                timing_func: linearTiming
            }), materials.killzone),
            new movingWall(makeRectanglePoints(new Vector2(111, -70), new Vector2(131, -110)), makeTimingFunction({
                period: 40,
                nodes: [
                    [0, new Vector2(0, 0)],
                    [39, new Vector2(80, 0)]
                ],
                bounce: true,
                timing_func: linearTiming
            }), materials.killzone),
            new movingWall(makeRectanglePoints(new Vector2(191, -150), new Vector2(211, -190)), makeTimingFunction({
                period: 40,
                nodes: [
                    [0, new Vector2(0, 0)],
                    [39, new Vector2(-80, 0)]
                ],
                bounce: true,
                timing_func: linearTiming
            }), materials.killzone),
            // new movingWall(makeRectanglePoints(new Vector2(151, 30), new Vector2(171, 10)), makeTimingFunction({
            //     period: 40,
            //     nodes: [
            //         [0, new Vector2(0, 0)],
            //         [49, new Vector2(80, 0)]
            //     ],
            //     bounce: true,
            //     timing_func: linearTiming
            // }), materials.killzone),
            // new movingWall(makeRectanglePoints(new Vector2(171, 0), new Vector2(191, -20)), makeTimingFunction({
            //     period: 40,
            //     nodes: [
            //         [0, new Vector2(0, 0)],
            //         [49, new Vector2(80, 0)]
            //     ],
            //     bounce: true,
            //     timing_func: linearTiming
            // }), materials.killzone),
        ],
        "checkpoints": [new Vector2(-80, -320), new Vector2(103, 155), new Vector2(312, 155), new Vector2(740, 35)],
        "cameraData": [[new Vector2(500, 0), null, 0.7]],
        "stars": [new Vector2(312, 255)]
    },
    {
        "id": "3",
        "extraObjects": [
            new movingWall(makeRectanglePoints(new Vector2(-430, -1250), new Vector2(-370, -1230)), makeTimingFunction({
                period: 60,
                nodes: [
                    [0, new Vector2(0, 0)],
                    [52, new Vector2(0, 0)],
                    [59, new Vector2(0, 100)]
                ],
                bounce: true,
                timing_func: linearTiming
            }), materials.wall)
        ],
        "checkpoints": [new Vector2(-80, -300), new Vector2(805, -590), new Vector2(-450, -1345), new Vector2(85, -720)],
        "cameraData": [
            [new Vector2(350, -1220), [new Vector2(-10000, -650), new Vector2(10000, -3000)], 0.6],
            [new Vector2(350, -1220), [new Vector2(700, -432), new Vector2(900, -750)], 0.6],
            [new Vector2(350, -1220), [new Vector2(139, -610), new Vector2(-1000, -1000)], 0.6],
            //[new Vector2(350, -1220), null, 0.6]
            [new Vector2(450, -800), null, 0.8]
        ],
        "stars": [new Vector2(-330, -920)]
    },
    {
        "id": "4",
        "extraObjects": [],
        "checkpoints": [new Vector2(-80, -300), new Vector2(750, -330), new Vector2(-140, -430), new Vector2(-220, -340)],
        "cameraData": [
            [new Vector2(-400, -1100), [new Vector2(-111, -375), new Vector2(-1000, -1000)], 1],
            [new Vector2(-400, -1100), [new Vector2(-190, -300), new Vector2(-1000, -1000)], 1],
            [new Vector2(450, -800), null, 0.8]
        ],
        "stars": [new Vector2(-360, -340)]
    },
]

// let levelUserData = [
//     {
//         "playing": false,
//         "beststars": 0,
//         "besttime": Infinity // beastars lol
//     }
// ]

// try to get leveluser data
let resetData;

$.when(...levelSVGs).done((...arguments) => {
    let levelUserData = {};
    if (localStorage.getItem("userprogress") === null) {
    }
    else {
        levelUserData = JSON.parse(localStorage.getItem("userprogress"));
    }
    // verify this one
    for (let leveldata of levelAdditionalData) {
        if (levelUserData[leveldata.id] === undefined) {
            levelUserData[leveldata.id] = {
                "playing": false,
                "beststars": 0,
                "besttime": undefined,
                "besttimewithallstars": undefined,
                "passed": false,
                "attempts": 0
            }
        }
        levelUserData[leveldata.id].playing = false; // no level is being played at the moment
    }

    resetData = () => {
        for (let leveldata of levelAdditionalData) {
            levelUserData[leveldata.id] = {
                "playing": false,
                "beststars": 0,
                "besttime": undefined,
                "besttimewithallstars": undefined,
                "passed": false,
                "attempts": 0
            }
        }
        localStorage.setItem("userprogress", JSON.stringify(levelUserData))
    }

    let timerrunning = false;
    let startTime = new Date();
    let timeElapsed = null;
    function completeLevel(framenum, stars) {
        let currleveldata = levelUserData[levelAdditionalData[currLevelIdx].id]
        currleveldata.passed = true;
        let starsgotten = 0;
        console.log(stars);
        for (let star of stars) {
            if (star.visited) starsgotten += 1;
        }
        if (starsgotten == stars.length) {
            // got all stars
            currleveldata.besttimewithallstars = Math.min(currleveldata.besttimewithallstars ?? Infinity, timeElapsed)
        }
        currleveldata.besttime = Math.min(currleveldata.besttime ?? Infinity, timeElapsed)
        currleveldata.beststars = Math.max(currleveldata.beststars, starsgotten)
        localStorage.setItem("userprogress", JSON.stringify(levelUserData))
        toggleIngame(false);
    }

    let player = new Player(1);
    let framenum = 0;
    let currLevel = null;
    function startLevel(index) {
        let additionalData = levelAdditionalData[index];
        levelUserData[additionalData.id].attempts += 1;
        player = new Player(1);
        currLevelIdx = index;
        currLevel = new Level(additionalData.objs.concat(additionalData.extraObjects), additionalData.checkpoints, additionalData.cameraData, additionalData.stars, () => {
            timerrunning = false;
        }, (framenum, stars) => { completeLevel(framenum, stars) })
        currLevel.init_player(player);
        framenum = 0;
        startTime = new Date();
        timerrunning = true;
        toggleIngame(true);
    }
    // console.log(arguments);
    for (let i = 0; i < arguments.length; i++) {
        let id = "levelcontainer" + i;
        let container = document.createElement("div")
        container.style.display = "none";
        container.id = id;
        document.body.appendChild(container)
        container.innerHTML = new XMLSerializer().serializeToString(arguments[i][0].documentElement);
        levelAdditionalData[i].objs = makeObjects(id);
    }

    var app = new Vue({
        el: '#app',
        data: {
            levellist: levelAdditionalData,
            userdata: levelUserData
        },
        methods: {
            startLevel: startLevel,
            formattime: formattime
        }
    })

    // let levels = [];
    then = Date.now();
    let fpsInterval = 1000 / 30
    let animate = () => {
        requestAnimationFrame(animate)
        now = Date.now();
        elapsed = now - then;
        if (ingame && (elapsed > fpsInterval)) {
            then = now - (elapsed % fpsInterval);
            stats.begin();
            if (killPlayerNextFrame) {
                killPlayerNextFrame = false;
                player.kill(framenum);
            }
            if (resetNextFrame) {
                resetNextFrame = false;
                startLevel(currLevelIdx);
            }
            currLevel.timestep(player, ctx, canvas, framenum, inputs);
            if (timerrunning) {
                timeElapsed = new Date() - startTime;
                //document.getElementById("timer").innerHTML = formattime(timeElapsed);
            }
            framenum += 1;
            stats.end();
        }
    }

    animate();
})