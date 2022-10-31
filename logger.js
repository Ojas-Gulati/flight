function log(msg) {
    document.getElementById("log").innerHTML += "<br />" + msg;
}

function logErr(e) {
    document.getElementById("log").innerHTML += "<br />" + "&lt;" + e.fileName + ":" + e.lineNumber + "&gt; " + e.message;
}