[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/arc-data-export.svg)](https://www.npmjs.com/package/@advanced-rest-client/arc-data-export)

[![Build Status](https://travis-ci.org/advanced-rest-client/arc-data-export.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/arc-data-export)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/arc-data-export)

## &lt;arc-data-export&gt;

An element to handle data export ARC.
It's event based API allows to use the element anywhere in the DOM and
other ARC components will communicate with `arc-data-export` to request data export.


```html
<arc-data-export></arc-data-export>
```

### API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)

## Usage

```javascript
const e = new CustomEvent('export-data', {
  bubbles: true,
  cancelable: true,
  composed: true,
  detail: {
    file: 'arc-data-export.json',
    destination: 'file',
    type: 'arc-export',
    data: {
      requests: true,
      projects: true,
      'history-url': [{...}]
    }
  }
});
this.dispatchEvent(e);
```

### Installation
```
npm install --save @advanced-rest-client/arc-data-export
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@advanced-rest-client/arc-data-export/arc-data-export.js';
    </script>
  </head>
  <body>
    <arc-data-export></arc-data-export>
  </body>
</html>
```

### In a Polymer 3 element

```js
import {PolymerElement, html} from '@polymer/polymer';
import '@advanced-rest-client/arc-data-export/arc-data-export.js';

class SampleElement extends PolymerElement {
  static get template() {
    return html`
    <arc-data-export></arc-data-export>
    `;
  }

  _authChanged(e) {
    console.log(e.detail);
  }
}
customElements.define('sample-element', SampleElement);
```

### Installation

```sh
git clone https://github.com/advanced-rest-client/arc-data-export
cd api-url-editor
npm install
npm install -g polymer-cli
```

### Running the demo locally

```sh
polymer serve --npm
open http://127.0.0.1:<port>/demo/
```

### Running the tests
```sh
polymer test --npm
```
