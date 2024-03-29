// Smoothly move servos towards their goal positions
function settleServos(context) {
  const {
    state: { pwm, servos, settleServoFilter }
  } = context;

  for (const servo of servos.all()) {
    if (settleServoFilter && !settleServoFilter(servo)) {
      continue;
    }

    const { index, pid, position } = servo;
    const error = position.goal - position.current;
    position.current += pid.step(error);
    pwm.setPwm(index, 0, position.current);
  }

  return context;
}

module.exports = settleServos;
