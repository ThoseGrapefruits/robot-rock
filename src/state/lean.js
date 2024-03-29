const { scaleAxisToServo } = require('../util/index.js');

let justLeaned = false;

function lean(context) {
  const {
    input: {
      axes: {
        right: { x, y }
      },
      buttonsPressed
    },
    state
  } = context;

  const shouldLean = buttonsPressed.has(4);

  if (shouldLean) {
    justLeaned = true;
    const { servos: { legs } } = state;

    for (let { elbow, shoulder } of legs.left) {
      elbow.position.goal    = scaleAxisToServo(-x, elbow);
      shoulder.position.goal = scaleAxisToServo(y,  shoulder);
    }

    for (let { elbow, shoulder } of legs.right) {
      elbow.position.goal    = scaleAxisToServo(-x, elbow);
      shoulder.position.goal = scaleAxisToServo(-y, shoulder);
    }
  } else if (justLeaned) {
    justLeaned = false;
    const { servos: { legs } } = state;
    for (const servo of legs.all()) {
      servo.position.goal = servo.position.neutral;
    }
  }

  return {
    ...context,
    state: {
      ...state,
      leaned: shouldLean
    }
  };
}

module.exports = lean;
