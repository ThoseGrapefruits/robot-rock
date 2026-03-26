const { scaleAxisToServo } = require('../util/index.js');

const ELBOW_RIGIDITY = 1.2;
const SHOULDER_RIGIDITY = 1.4;

const SPEED = 0.1;
const DEAD_ZONE = 0.015;

const { PI } = Math

const logNumber = (label, ...ns) => {
  ns = ns.map(n => `${ n < 0 ? ' ' : '' }${ n.toFixed(2) }`.padStart(7, ' '));
  console.log(label, ...ns);
};

const distances = {
  left: 0,
  right: 0
};

const posElbow = modDist => {
  if (modDist < 0.5)
    return 1;

  return 0;
};

const posShldr = modDist => {
  if (modDist < 0.5)
    return -1;
  return Math.min(1, -1 + modDist);
};

// Tank-style driving. Left stick controls left legs, right controls right.

function move(context) {
  const {
    state,
    input: { axes }
  } = context;

  let { moved=new Set } = state;

  moved.clear();

  const shouldMove = !state.leaned &&
    [ axes.left.magnitude, axes.right.magnitude ]
      .some(magnitude => DEAD_ZONE <= magnitude);

  if (shouldMove) {
    const { servos } = state;

    [ 'left', 'right' ].forEach((side, sideIndex) => {
      const axis = axes[side];
      let otherSide = side === 'left' ? 'right' : 'left';
      if (!distances[side] && distances[otherSide])
        distances[side] = distances[otherSide] + PI/2;
      distances[side] += (axis.y - DEAD_ZONE) * SPEED;
      const distance = distances[side];
      const legs = servos.legs[side] 
      let modDist;

      legs.forEach(({ elbow, shoulder }, legIndex) => {
        // if (legIndex !== 0) return;

        const timeShift = (legIndex % 2 === sideIndex % 2) * PI / 2;
        const sideSign = sideIndex ? 1 : -1;

        if (Math.abs(axis.y) >= DEAD_ZONE) {
          moved.add(elbow.index);
          moved.add(shoulder.index);
        }

        modDist = Math.abs((distance + timeShift) % PI);
        logNumber('ds', distance, modDist);
        elbow.position.goal = scaleAxisToServo(
          posElbow(modDist) * sideSign / ELBOW_RIGIDITY,
          elbow
        );
        shoulder.position.goal = scaleAxisToServo(
          posShldr(modDist) * sideSign / SHOULDER_RIGIDITY,
          shoulder
        );
      });
    })
  } else {
    distances.left = 0;
    distances.right = 0;
  }

  return {
    ...context,
    state: {
      ...state,
      moved
    }
  };
}

function squareWave({ period=2, inset=1, intensity=1 }) {
  return (distance => ((distance % period) < inset) ? intensity : -intensity);
};

function triangleWave(period, intensity=1) {
  let periodHalf = period / 2;
  return (distance => distance % periodHalf < period
    ? distance % period
    : period - distance % period);
};

module.exports = move;
