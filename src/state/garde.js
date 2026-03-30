const { scaleAxisToServo } = require('../util/index.js');

let pretEnGarde = false;

function garde(context) {
  const {
    input: {
      axes: {
        right: { x, y }
      },
      buttonsPressed
    },
    state
  } = context;

  const fautGarde = buttonsPressed.has(5) && !state.inLean;

  if (fautGarde) {
    pretEnGarde = true;
    const { servos: { legs } } = state;

    legs.left.forEach(({ elbow, shoulder }, i) => {
      elbow.position.goal = scaleAxisToServo((() => {
        switch (i) {
          case 0:
            return -1;
          case 1:
            return 0.2;
          case 2:
            return -0.8;
        }
      })(), elbow);
      shoulder.position.goal = scaleAxisToServo((() => {
        switch (i) {
          case 0:
            return y + 1;
          case 1:
            return 1;
          case 2:
            return -0.5;
          default:
            throw new Error(`unknown leg ${ i }`);
        }
      })(), shoulder);
    });

    legs.right.forEach(({ elbow, shoulder }, i) => {
      elbow.position.goal = scaleAxisToServo((() => {
        switch (i) {
          case 0:
            return 0.8;
          case 1:
            return -0.2;
          case 2:
            return 1;
        }
      })(), elbow);
      shoulder.position.goal = scaleAxisToServo((() => {
        switch (i) {
          case 0:
            return 0.5;
          case 1:
            return -1;
          case 2:
            return -y - 1;
          default:
            throw new Error(`unknown leg ${ i }`);
        }
      })(), shoulder);
    });

  } else if (pretEnGarde) {
    pretEnGarde = false;
    const { servos: { legs } } = state;
    for (const servo of legs.all()) {
      servo.position.goal = servo.position.neutral;
    }
  }

  return {
    ...context,
    state: {
      ...state,
      enGarde: fautGarde
    }
  };
}

module.exports = garde;
