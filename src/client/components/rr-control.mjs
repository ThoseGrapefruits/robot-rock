import { css, html, LitElement } from 'https://unpkg.com/lit-element@2/lit-element.js?module';
import { sockJSON } from '/sockem-bopper.mjs';

import '/components/rr-axis-plot.mjs';

const rrGamepads = Symbol();
const rrIntervalHandle = Symbol();

class RRControlElement extends LitElement {
  static get properties() {
    return {
      [rrGamepads]: { attribute: false, type: Object },
      activeGamepadIndex: { attribute: false, type: Number },
      axesHash: { attribute: false, type: Array },
      buttonsHash: { attribute: false, type: Array }
    };
  }

  [rrIntervalHandle];

  static get styles() {
    return css`
      :host {
        display: block;
      }
    `;
  }

  get activeGamepad() {
    if (this.activeGamepadIndex == null) {
      return null;
    }

    return navigator.getGamepads()[this.activeGamepadIndex];
  }

  get gamepadCount() {
    return countKeys(this.gamepads)
  }

  get gamepads() {
    return this[rrGamepads];
  }

  set gamepads(gamepads) {
    this.stopInterval();

    this[rrGamepads] = gamepads;

    if (countKeys(gamepads)) {
      this.startInterval();
    }
  }

  startInterval() {
    this[rrIntervalHandle] = setInterval(this.lööp, 100);
  }

  stopInterval() {
    if (this[rrIntervalHandle]) {
      clearInterval(this[rrIntervalHandle]);
    }
  }

  handleGamepadConnected = event => {
    const { gamepad } = event;
    this.gamepads = {
      ...this.gamepads,
      [gamepad.index]: gamepad
    }

    let gamepads = Object.values(this.gamepads);

    switch (gamepads.length) {
      case 0:
        break;
      case 1:
        this.activeGamepadIndex = gamepads[0].index
        break;
    }
  };

  handleGamepadDisconnected = event => {
    delete this.gamepads[event.gamepad.index];
  };

  handleSelectGamepad = event => {
    this.activeGamepadIndex = event.target.dataset.id;
  };

  lööp = () => {
    let { activeGamepad } = this;

    if (!activeGamepad) {
      return;
    }

    const { axes, buttons } = activeGamepad;

    const buttonsHash = buttons
      .filter(button => buttonPressed(button))
      .join(',');

    if (buttonsHash !== this.buttonsHash) {
      this.buttonsHash = buttonsHash;
    }

    const axesHash = axes.reduce((a, b) => a + b, 0);

    if (axesHash !== this.axesHash) {
      this.axesHash = axesHash;
    }

    sockJSON({
      input: {
        buttonsPressed: buttons.flatMap((button, index) =>
          buttonPressed(button) ? [ index ] : []),
        buttonsValues: buttons.reduce((acc, button, index) => {
          if (button.value)
            acc[index] = button.value;
          return acc;
        }, {}),
        axes: {
          left: {
            x: axes[0],
            y: axes[1]
          },
          right: {
            x: axes[2],
            y: axes[3]
          }
        }
      }
    });

    this.requestUpdate();
  };

  connectedCallback() {
    super.connectedCallback();
    addEventListener('gamepadconnected', this.handleGamepadConnected);
    addEventListener('gamepaddisconnected', this.handleGamepadDisconnected);
  }

  async disconnectedCallback() {
    super.disconnectedCallback();
    removeEventListener('gamepadconnected', this.handleGamepadConnected);
    removeEventListener('gamepaddisconnected', this.handleGamepadDisconnected);
    await sockJSON({ input: null });
  }

  render() {
    if (this.gamepadCount === 0) {
      return html`
        <p>Connect a controller and press any button.</p>
      `;
    }

    if (this.activeGamepad) {
      return html`
        ${ renderGamepad.call(this, this.activeGamepad) }
        <hr>
        ${ this.renderGamepadOptions() }
      `;
    }

    return this.renderGamepadOptions();
  }

  renderGamepadOptions() {
    return html`
      <p>${ this.gamepadCount } controllers connected.</p>
      <ul>
        ${ Object.values(this.gamepads).map(renderGamepadOption.bind(this)) }
      </ul>
    `;
  }
}

customElements.define('rr-control', RRControlElement);

function countKeys(object) {
  return object
    ? Object.getOwnPropertyNames(object).length
    : 0;
}

function buttonPressed(b) {
  if (typeof(b) == "object") {
    return b.pressed;
  }
  return b == 1.0;
}

function renderGamepad({ axes, buttons, id, index }) {
  return html`
    <h4>${ id }</h4>
    <dl>
      <dt>Axes
      <dd>
        <rr-axis-plot .x="${ axes[0] }" .y="${ axes[1] }"></rr-axis-plot>
        <rr-axis-plot .x="${ axes[2] }" .y="${ axes[3] }"></rr-axis-plot>

      <dt>Buttons
      <dd>${ buttons.length }

      <dt>Index
      <dd>${ index }
    </dl>

    <h4>Pressed buttons</h4>
    <ul>
      ${ buttons.flatMap((button, index) =>
        buttonPressed(button) ? [ html`<li>${ index }</li>` ] : [])
      }
    </ul>

    <h4>Pressed triggers</h4>
    <dl>
      ${ buttons.flatMap((button, index) =>
        (button.value && button.value !== 1) ? [ html`
          <dt>${ index }</dt>
          <dd>${ button.value.toFixed(2) }</dd>
        ` ] : [])
      }
    </dl>
  `;
}

function renderGamepadOption({ id, index }) {
  return html`
    <h4>${ id }</h4>
    <button
      @click="${ this.handleSelectGamepad }"
      data-id="${ index }"
      ?disabled="${ index === this.activeGamepadIndex }">
      Use this gamepad
    </button>
  `;
}
