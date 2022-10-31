
let inputs = {
  "ArrowDown": false,
  "ArrowUp": false,
  "ArrowLeft": false,
  "ArrowRight": false
}

let killPlayerNextFrame = false;
let resetNextFrame = false;

window.addEventListener("keydown", function (event) {
  if (event.defaultPrevented) {
    return; // Do nothing if the event was already processed
  }

  switch (event.code) {
    case "KeyS":
    case "ArrowDown":
      // code for "down arrow" key press.
      inputs["ArrowDown"] = true;
      document.getElementById("ArrowDown").classList.toggle("button-pressed", true)
      break;
    case "KeyW":
    case "ArrowUp":
    case "Space":
      // code for "up arrow" key press.
      inputs["ArrowUp"] = true;
      document.getElementById("ArrowUp").classList.toggle("button-pressed", true)
      break;
    case "KeyA":
    case "ArrowLeft":
      // code for "left arrow" key press.
      inputs["ArrowLeft"] = true;
      document.getElementById("ArrowLeft").classList.toggle("button-pressed", true)
      break;
    case "KeyD":
    case "ArrowRight":
      // code for "right arrow" key press.
      inputs["ArrowRight"] = true;
      document.getElementById("ArrowRight").classList.toggle("button-pressed", true)
      break;
    case "KeyK":
      killPlayerNextFrame = true;
      break;
    case "KeyR":
      resetNextFrame = true;
      break;
    case "KeyB":
      toggleIngame(false);
      break;
    default:
      return; // Quit when this doesn't handle the key event.
  }

  // Cancel the default action to avoid it being handled twice
  event.preventDefault();
}, true);

window.addEventListener("keyup", function (event) {
  if (event.defaultPrevented) {
    return; // Do nothing if the event was already processed
  }
  console.log(event.code);
  switch (event.code) {
    case "KeyS":
    case "ArrowDown":
      // code for "down arrow" key press.
      inputs["ArrowDown"] = false;
      document.getElementById("ArrowDown").classList.toggle("button-pressed", false)
      break;
    case "KeyW":
    case "ArrowUp":
    case "Space":
      // code for "up arrow" key press.
      inputs["ArrowUp"] = false;
      document.getElementById("ArrowUp").classList.toggle("button-pressed", false)
      break;
    case "KeyA":
    case "ArrowLeft":
      // code for "left arrow" key press.
      inputs["ArrowLeft"] = false;
      document.getElementById("ArrowLeft").classList.toggle("button-pressed", false)
      break;
    case "KeyD":
    case "ArrowRight":
      // code for "right arrow" key press.
      inputs["ArrowRight"] = false;
      document.getElementById("ArrowRight").classList.toggle("button-pressed", false)
      break;
    default:
      return; // Quit when this doesn't handle the key event.
  }

  // Cancel the default action to avoid it being handled twice
  event.preventDefault();
}, true);