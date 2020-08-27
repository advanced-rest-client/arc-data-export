[![Published on NPM](https://img.shields.io/npm/v/@advanced-rest-client/arc-data-export.svg)](https://www.npmjs.com/package/@advanced-rest-client/arc-data-export)

[![Build Status](https://travis-ci.com/advanced-rest-client/arc-data-export.svg)](https://travis-ci.com/advanced-rest-client/arc-data-export)

# Advanced REST Client export module

A module containing ARC data export logic and UIs. It has the main export data processing logic (via the `<arc-data-export>` custom element) and helper UIs used when initializing the export flow.

## Deprecation notice

This element is deprecated. It has been replaced by the `@advanced-rest-client/arc-io` package.

## Export architecture

The data export process is a 2-step process. With the first step the application prepares the data to be exported. The `<arc-data-export>` custom element build an export object with the current ARC standard. The export object can be then imported back to the application via `arc-data-import` module.
The second step is the data storing which is not handled by this module. Instead this module describes an interface that the data export providers must use (via the events definition).

## Usage

### Installation
```
npm install --save @advanced-rest-client/arc-data-export
```

### arc-data-export custom element

An element to handle data export in Advanced REST Client application. It creates an unified export object.

The element/event accepts two configuration options:
-   export data configuration
-   export provider configuration

Types are defined in `@advanced-rest-client/arc-types` module under `DataExport` namespace.

Example use of the DOM events

```javascript
import { ExportEvents } from '@advanced-rest-client/arc-data-export';

const data = {
  requests: true,
  projects: true,
  ...
};
const exportOptions = {
  encrypt: true,
  passphrase: 'pwd',
  provider: 'file',
};
const providerOptions = {
  file: 'export.json',
  parent: '/home/me/Documents',
};
const result = await ExportEvents.nativeData(document.body, data, exportOptions, providerOptions);
const { success, interrupted, fileId, parentId } = result;
if (!success && !interrupted) {
  // export error
} else if (!success && interrupted) {
  // user interrupted
} else {
  const fileLocation = `${fileId}/${parentId}`;
}
```

## Development

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
