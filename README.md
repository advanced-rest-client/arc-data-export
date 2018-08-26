[![Build Status](https://travis-ci.org/advanced-rest-client/api-url-data-model.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/arc-data-export)

# arc-data-export

An element to handle data export ARC.
It's event based API allows to use the element anywhere in the DOM and
other ARC components will communicate with `arc-data-export` to request data export.

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

### API components

This components is a part of API components ecosystem: https://elements.advancedrestclient.com/
