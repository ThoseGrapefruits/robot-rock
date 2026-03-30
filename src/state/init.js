const makePWM = require('adafruit-pca9685');
const KalmanFilter = require('kalmanjs');
const MPU6050 = require('mpu6050-gyro');

const { PID } = require('../util/index.js');

const rrCurrent = Symbol('RRC');
const rrGoal = Symbol('RRG');
const rrMax = Symbol('RRM');
const rrMin = Symbol('RRµ');
const rrNeutral = Symbol('RRN');

function initRobot({
  pid={ kP: 5, kI: 0.01, kD: 0 },
  gyroFilter={ Q: 0.001, R: 0.1 }
} = {}) {
  return {
    gyro: {
      controller: new MPU6050(1, 0x68),
      filter: {
        x: new KalmanFilter(gyroFilter),
        y: new KalmanFilter(gyroFilter),
      },
    },
    pid: {
      x: new PID(pid),
      y: new PID(pid)
    },

    pwm: makePWM(),
    servos: {
      * all() {
        yield * this.legs.all();
        yield * this.camera.all();
      },

      * even() {
        for (let servo of this.all()) {
          if (servo.index % 2 === 0) {
            yield servo;
          }
        }
      },

      * odd() {
        for (let servo of this.all()) {
          if (servo.index % 2 !== 0) {
            yield servo;
          }
        }
      },
      camera: {
        * all() {
          yield this.x;
          yield this.y;
        },
        x: initServo(12, {
          position: {
            max: 500,
            min: 100,
          }
        }),
        y: initServo(13, {
          position: {
            max: 500,
            min: 270,
          }
        })
      },
      legs: {
        * all() {
          for (const leg of this.left) {
            yield * leg.all();
          }
          for (const leg of this.right) {
            yield * leg.all();
          }
        },
        left: [ {
          // left back
          start: 0 + 4,
          startLeg: 0,
          shoulder: {
            minUnsafe: 0,
            min: 150,
            neutral: 250,
            max: 450,
            maxUnsafe: 600
          }
        }, {
          // left middle
          start: 0 + 2,
          startLeg: 0,
          shoulder: {
            min: 150,
            neutral: 300,
            max: 450
          }
        }, {
          // left front
          start: 0,
          startLeg: 0,
          shoulder: {
            minUnsafe: 0,
            min: 200,
            neutral: 350,
            max: 450,
            maxUnsafe: 600
          }
        } ].map(initLeg),
        right: [ {
          // right back
          start: 6,
          startLeg: 6,
          shoulder: {
            minUnsafe: 0,
            min: 200,
            neutral: 350,
            max: 450,
            maxUnsafe: 600
          }
        }, {
          // right middle
          start: 6 + 2,
          startLeg: 6,
          shoulder: {
            min: 250,
            neutral: 300,
            max: 550
          }
        }, {
          // right front
          start: 6 + 4,
          startLeg: 6,
          shoulder: {
            minUnsafe: 0,
            min: 150,
            neutral: 250,
            max: 450,
            maxUnsafe: 600
          }
        } ].map(initLeg)
      }
    },
  };
}

function initLeg({ shoulder, start, startLeg }) {
  return {
    * all() {
      yield this.shoulder;
      yield this.elbow;
    },
    elbow: initServo(start + 1, {
      min: 140,
      neutral: startLeg ? 350 : 250,
      max: 520
    }),
    shoulder: initServo(start, shoulder)
  };
}

function initServo(index, { max, min, neutral, position={} }={}) {
  const middlePosition = neutral || 300;

  return {
    index,
    pid: new PID({
      kP: 0.15,
      kI: 0.001,
      kD: 0.0001,
    }),

    position: {
      // NOTE: Any "soft" updates to servo position (want to use PID) should
      // only update `goal`. Any "hard" updates should update both `current` and
      // `goal` as well as call `pwm.setPwm` directly.
      [rrCurrent]: middlePosition,
      get current() {
        return this[rrCurrent];
      },
      set current(value) {
        this[rrCurrent] = minmax(assertNonNaN(value), this.min, this.max);
      },

      [rrGoal]: middlePosition,
      get goal() {
        return this[rrGoal];
      },
      set goal(value) {
        this[rrGoal] = minmax(assertNonNaN(value), this.min, this.max);
      },

      [rrMax]: max || (middlePosition + 150),
      get max() {
        return this[rrMax];
      },
      set max(value) {
        this[rrMax] = assertNonNaN(value);
      },

      [rrMin]: min || (middlePosition - 150),
      get min() {
        return this[rrMin];
      },
      set min(value) {
        this[rrMin] = assertNonNaN(value);
      },

      [rrNeutral]: middlePosition,
      get neutral() {
        return this[rrNeutral];
      },
      set neutral(value) {
        this[rrNeutral] = assertNonNaN(value);
      },

      ...position,

      get mid() {
        return this.min + this.range / 2;
      },

      get range() {
        return this.max - this.min;
      },

      get rangeAngle() {
        // TODO I don't actually know what the position-to-radians ratio is.
        // Based on the ranges the original program had, and the physical
        // limitations of servo movement, 600 seems reasonable.
        return this.range / 600;
      }
    }
  };
}

// UTIL ////////////////////////////////////////////////////////////////////////

function assertNonNaN(x) {
  if (isNaN(x)) {
    throw new Error('NaN');
  }

  return x;
}

function minmax(x, min, max) {
  return Math.min(
    max,
    Math.max(
      min,
      x
    )
  );
}

module.exports = initRobot;
