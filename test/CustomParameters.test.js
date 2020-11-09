// eslint-disable-next-line import/no-unresolved
import { assert } from '@esm-bundle/chai';
import * as CustomParameters from '../src/CustomParameters.js';

describe('CustomParameters', () => {
  describe('applyCustomSettingsQuery()', () => {
    const params = {
      parameters: [{
        name: 'aqp1',
        value: 'aqQv1'
      }],
    };

    it('returns a string', () => {
      const result = CustomParameters.applyCustomSettingsQuery('', params);
      assert.typeOf(result, 'string');
    });

    it('returns the same string when no settings', () => {
      const result = CustomParameters.applyCustomSettingsQuery('', {});
      assert.equal(result, '');
    });

    it('returns params in query string.', () => {
      const result = CustomParameters.applyCustomSettingsQuery('', params);
      assert.equal(result, '?aqp1=aqQv1');
    });
  });

  describe('applyCustomSettingsBody()', () => {
    const customData = {
      auth: {
        parameters: [{
          name: 'aqp1',
          value: 'aqQv1'
        }]
      },
      token: {
        parameters: [{
          name: 'tqp1',
          value: 'tqQv1'
        }],
        headers: [{
          name: 'th1',
          value: 'thv1'
        }],
        body: [{
          name: 'tb1',
          value: 'tbv1'
        }]
      }
    };
    it('returns a string', () => {
      const result = CustomParameters.applyCustomSettingsBody('', customData);
      assert.typeOf(result, 'string');
    });

    it('returns the same string when no settings', () => {
      const result = CustomParameters.applyCustomSettingsBody('', {});
      assert.equal(result, '');
    });

    it('returns params in query string.', () => {
      const result = CustomParameters.applyCustomSettingsBody('', customData);
      assert.equal(result, '&tb1=tbv1');
    });
  });

  describe('applyCustomSettingsHeaders()', () => {
    const customData = {
      auth: {
        parameters: [{
          name: 'aqp1',
          value: 'aqQv1'
        }]
      },
      token: {
        parameters: [{
          name: 'tqp1',
          value: 'tqQv1'
        }],
        headers: [{
          name: 'th1',
          value: 'thv1'
        }],
        body: [{
          name: 'tb1',
          value: 'tbv1'
        }]
      }
    };
    it('adds new headers', () => {
      const headers = { 'test': true };
      const result = CustomParameters.applyCustomSettingsHeaders(headers, customData);
      assert.equal(result.th1, 'thv1');
    });

    it('returns the same headers object', () => {
      const headers = { 'test': true };
      const result = CustomParameters.applyCustomSettingsHeaders(headers, {});
      assert.isTrue(result === headers);
    });

    it('returned object is a copy', () => {
      const headers = { 'test': true };
      const result = CustomParameters.applyCustomSettingsHeaders(headers, customData);
      assert.isFalse(result === headers);
    });
  });
});