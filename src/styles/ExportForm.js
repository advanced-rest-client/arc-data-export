import { css } from 'lit-element';

export default css`
:host {
  display: block;
  font-size: var(--arc-font-body1-font-size);
  font-weight: var(--arc-font-body1-font-weight);
  line-height: var(--arc-font-body1-line-height);
}

h3 {
  font-size: var(--arc-font-subhead-font-size);
  font-weight: var(--arc-font-subhead-font-weight);
  line-height: var(--arc-font-subhead-line-height);
  font-size: 14px;
}

.error-toast {
  background-color: var(--warning-primary-color, #ff7043);
  color: var(--warning-contrast-color, #fff);
}

anypoint-listbox iron-icon {
  color: var(--context-menu-item-color);
}

anypoint-checkbox {
  margin: 12px 0px;
  display: block;
}

.prepare-info {
  font-size: 15px;
  margin-top: 24px;
}

.actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 24px;
}

.action-button {
  margin-right: 8px;
  background-color: var(--action-button-background-color);
  background-image: var(--action-button-background-image);
  color: var(--action-button-color);
  transition: var(--action-button-transition);
}

.action-button:not([disabled]):hover {
  background-color: var(--action-button-hover-background-color);
  color: var(--action-button-hover-color);
}

.action-button[disabled] {
  background-color: var(--action-button-disabled-background-color);
  color: var(--action-button-disabled-color);
}

.inline-config {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
}

.destination-dropdown {
  margin-right: 8px;
}

.icon {
  width: 24px;
  height: 24px;
}
`;
