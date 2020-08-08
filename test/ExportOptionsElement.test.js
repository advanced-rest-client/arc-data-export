import { fixture, assert } from '@open-wc/testing';
import '../export-options.js';

/** @typedef {import('../index.js').ExportOptionsElement} ExportOptionsElement */

describe('ExportOptionsElement', () => {
  /**
   * @return {Promise<ExportOptionsElement>}
   */
  async function basicFixture() {
    return (fixture(`<export-options></export-options>`));
  }

  /**
   * @return {Promise<ExportOptionsElement>}
   */
  async function validFixture() {
    return (fixture(`<export-options
      file="test-file"
      provider="file"></export-options>`));
  }

  /**
   * @return {Promise<ExportOptionsElement>}
   */
  async function fullDriveFixture() {
    return (fixture(`
    <export-options
      file="test-file.json"
      provider="drive"
      skipimport
      parentId="test"
      withEncrypt
      encryptFile
      passphrase="test-passwd"
    ></export-options>`));
  }

  describe('view rendering', () => {
    it('renders skip import checkbox', async () => {
      const element = await basicFixture();
      const input = element.shadowRoot.querySelector('anypoint-checkbox[name="skipImport"]');
      assert.ok(input);
    });

    it('does not render encrypt file checkbox by defult', async () => {
      const element = await basicFixture();
      const input = element.shadowRoot.querySelector('anypoint-checkbox[name="encryptFile"]');
      assert.notOk(input);
    });

    it('does not render password input by defult', async () => {
      const element = await basicFixture();
      const input = element.shadowRoot.querySelector('anypoint-masked-input[name="passphrase"]');
      assert.notOk(input);
    });

    it('renders encrypt file checkbox', async () => {
      const element = await fullDriveFixture();
      const input = element.shadowRoot.querySelector('anypoint-checkbox[name="encryptFile"]');
      assert.ok(input);
    });

    it('renders password field', async () => {
      const element = await fullDriveFixture();
      const input = element.shadowRoot.querySelector('anypoint-masked-input[name="passphrase"]');
      assert.ok(input);
    });

    it('renders provider dropdown', async () => {
      const element = await basicFixture();
      const input = element.shadowRoot.querySelector('anypoint-dropdown-menu[name="provider"]');
      assert.ok(input);
    });

    it('renders file name input', async () => {
      const element = await basicFixture();
      const input = element.shadowRoot.querySelector('anypoint-input[name="file"]');
      assert.ok(input);
    });

    it('does not render parent input by defult', async () => {
      const element = await basicFixture();
      const input = element.shadowRoot.querySelector('anypoint-input[name="parentId"]');
      assert.notOk(input);
    });

    it('renders parent name input when drive is selected', async () => {
      const element = await fullDriveFixture();
      const input = element.shadowRoot.querySelector('anypoint-input[name="parentId"]');
      assert.ok(input);
    });

    it('renders action buttons', async () => {
      const element = await basicFixture();
      const buttons = element.shadowRoot.querySelectorAll('.actions anypoint-button');
      assert.equal(buttons.length, 2);
    });
  });

  describe('onaccept', () => {
    let element;
    beforeEach(async () => {
      element = await validFixture();
    });

    it('Getter returns previously registered handler', () => {
      assert.isUndefined(element.onaccept);
      const f = () => {};
      element.onaccept = f;
      assert.isTrue(element.onaccept === f);
    });

    it('Calls registered function', () => {
      let called = false;
      const f = () => {
        called = true;
      };
      element.onaccept = f;
      element.confirm();
      element.onaccept = null;
      assert.isTrue(called);
    });

    it('Unregisteres old function', () => {
      let called1 = false;
      let called2 = false;
      const f1 = () => {
        called1 = true;
      };
      const f2 = () => {
        called2 = true;
      };
      element.onaccept = f1;
      element.onaccept = f2;
      element.confirm();
      element.onaccept = null;
      assert.isFalse(called1);
      assert.isTrue(called2);
    });
  });

  describe('oncancel', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Getter returns previously registered handler', () => {
      assert.isUndefined(element.oncancel);
      const f = () => {};
      element.oncancel = f;
      assert.isTrue(element.oncancel === f);
    });

    it('Calls registered function', () => {
      let called = false;
      const f = () => {
        called = true;
      };
      element.oncancel = f;
      element.cancel();
      element.oncancel = null;
      assert.isTrue(called);
    });

    it('Unregisteres old function', () => {
      let called1 = false;
      let called2 = false;
      const f1 = () => {
        called1 = true;
      };
      const f2 = () => {
        called2 = true;
      };
      element.oncancel = f1;
      element.oncancel = f2;
      element.cancel();
      element.oncancel = null;
      assert.isFalse(called1);
      assert.isTrue(called2);
    });
  });

  describe('onresize', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Getter returns previously registered handler', () => {
      assert.isUndefined(element.onresize);
      const f = () => {};
      element.onresize = f;
      assert.isTrue(element.onresize === f);
    });

    it('Calls registered function', () => {
      let called = false;
      const f = () => {
        called = true;
      };
      element.onresize = f;
      element.provider = 'drive';
      element.onresize = null;
      assert.isTrue(called);
    });

    it('Unregisteres old function', () => {
      let called1 = false;
      let called2 = false;
      const f1 = () => {
        called1 = true;
      };
      const f2 = () => {
        called2 = true;
      };
      element.onresize = f1;
      element.onresize = f2;
      element.provider = 'drive';
      element.onresize = null;
      assert.isFalse(called1);
      assert.isTrue(called2);
    });
  });

  describe('a11y', () => {
    it('is accessible with data', async () => {
      const element = await fullDriveFixture();
      await assert.isAccessible(element, {
        ignoredRules: ['color-contrast'],
      });
    });
  });
});
