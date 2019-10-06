[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/arc-data-export.svg)](https://www.npmjs.com/package/@advanced-rest-client/arc-data-export)

[![Build Status](https://travis-ci.org/advanced-rest-client/arc-data-export.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/arc-data-export)

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/advanced-rest-client/arc-data-export)

## &lt;arc-data-export&gt;

An element to handle data export in Advanced REST Client application. It creates an unified export object.

It's event based API allows to use the element anywhere in the DOM and other ARC components will communicate with `arc-data-export` to request data export.

After the export object is created it dispatches `file-data-save` or `google-drive-data-save` custom events depending on export configuration. The element does not handle export operation as this vary depending on the platform. The application should handle this events and perform file/drive data save.

## Usage

### Installation
```
npm install --save @advanced-rest-client/arc-data-export
```

### arc-data-export event

```javascript
const e = new CustomEvent('arc-data-export', {
  bubbles: true,
  cancelable: true,
  composed: true,
  detail: {
    data: {
      requests: true,
      projects: true,
      'history-url': [{...}]
    },
    options: {
      provider: 'file or drive (at the moment)',
      file: 'export-file-name.arc',
      encrypt: true,
      passphrase: 'some pass phrase'
    },
    providerOptions: {
      contentType: 'application/restclient+data'
    }
  }
});
this.dispatchEvent(e);
```

#### data

The data property of the detail object contains a map of export items to process. Possible keys are:

-   `all` exports all data from all data stores `{all: true}`
-   `history` - History requests
-   `saved` - Saved requests, this includes projects.
-   `websocket` - Websocket URL history
-   `url-history` - URL history
-   `variables` - Defined application variables
-   `auth` - Stored authorization data
-   `cookies` - Stored cookies data
-   `host-rules` - Host rules data

Each property (expect for `all`) accepts either `true` to export all data from the store or an array of items to export.

```javascript
const data = {
  cookies: true,
  auth: [{...}, {...}]
};
```

#### options

Export options.

##### provider
The `provider` tells which export provider should be used.
Currently ARC supports `file` and `drive`.

##### file
Export file name.

##### encrypt

`Boolean`. When set it sends the content for encryption before exporting data to file/drive.
When set `passphrase` must be also set, even when empty string.
The component does not support data encoding. It dispatches `encryption-encode` custom event
for the application to encode the data.

The component requests for AES encryption. The generated file contains `aes` word in the first line
and encoded value in second line.

##### passphrase

A pass phrase to use to encrypt the content. It must be set to a string, however it can be empty.

#### providerOptions

`providerOptions` object is passed to the corresponding event dispatched to export provider.
Application can set `contentType` property. Only `application/json` and `application/restclient+data` is currently supported. Everything else is treated as text.

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

### In a LitElement template

```javascript
import { LitElement, html } from 'lit-element';
import '@advanced-rest-client/arc-data-export/arc-data-export.js';

class SampleElement extends LitElement {
  render() { `<arc-data-export></arc-data-export>`; }

  _doExport() {
    const node = this.shadowRoot.querySelector('arc-data-export');
    node.arcExport({
      data: {
        all: true
      },
      options: {
        provider: 'file',
        file: 'all-export.arc'
      }
    });
  }
}
customElements.define('sample-element', SampleElement);
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
}
customElements.define('sample-element', SampleElement);
```

### Development

```sh
git clone https://github.com/@advanced-rest-client/arc-data-export
cd arc-data-export
npm install
```

### Running the demo locally

```sh
npm start
```

### Running the tests
```sh
npm test
```
