function scaleAxisToServo(input, servo, { walk=false }={}) {
  const { min, max, neutral } = servo.position;
  if (walk && servo.position.minWalk)
    min = servo.position.minWalk;
  if (walk && servo.position.maxWalk)
    min = servo.position.maxWalk;

  let result;

  input = Math.min(1.0, Math.max(-1.0, input));
  if (input > 0) {
    result = input * Math.abs(neutral - max) + neutral;
  } else {
    result = input * Math.abs(neutral - min) + neutral;
  }

  return result;
}

module.exports = scaleAxisToServo;
