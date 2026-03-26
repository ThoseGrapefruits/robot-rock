function scaleAxisToServo(input, servo) {
  const { min, max, neutral } = servo.position;

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
