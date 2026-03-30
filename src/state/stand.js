const scaleAxisToServo = require('../util/scale-axis-to-servo');

let justStood = false;

function stand(context) {
  const { input, state } = context;

  const shouldStand =
    !state.inLean &&
    !state.inMove &&
    !state.enGarde;

  if (shouldStand) {
    justStood = true;
    const modPressed = input.buttonsPressed.has(7);
    let i = 0;

    for (const { elbow, shoulder } of state.servos.legs.left) {
      shoulder.position.goal = shoulder.position.neutral;
      elbow.position.goal = (!modPressed && input.buttonsPressed.has(i))
        ? scaleAxisToServo(-1, elbow)
        : elbow.position.neutral;
      i++;
    }

    i = 0;

    for (const { elbow, shoulder } of state.servos.legs.right) {
      shoulder.position.goal = shoulder.position.neutral;
      elbow.position.goal = (modPressed && input.buttonsPressed.has(i))
        ? scaleAxisToServo(1, elbow)
        : elbow.position.neutral;
      i++;
    }
  } else if (justStood) {
    justStood = false;
    for (let servo of state.servos.all())
      servo.position.goal = servo.position.neutral;
  }

  return context;
}

module.exports = stand;
