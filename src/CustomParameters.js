/** @typedef {import('@advanced-rest-client/arc-types').Authorization.OAuth2AuthorizationRequestCustomData} OAuth2AuthorizationRequestCustomData */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.OAuth2CustomData} OAuth2CustomData */

/**
 * Applies custom properties defined in the OAuth settings object to the URL.
 *
 * @param {string} url Generated URL for an endpoint.
 * @param {OAuth2AuthorizationRequestCustomData} data `customData.[type]` property from the settings object.
 * The type is either `auth` or `token`.
 * @return {string}
 */
export function applyCustomSettingsQuery(url, data) {
  if (!data || !data.parameters) {
    return url;
  }
  const char = url.includes('?') ? '&' : '?';
  const params = data.parameters.map((item) => {
    let { value } = item;
    if (value) {
      value = encodeURIComponent(value);
    } else {
      value = '';
    }
    return `${encodeURIComponent(item.name)}=${value}`;
  }).join('&');
  return `${url}${char}${params}`;
}

/**
 * Applies custom body properties from the settings to the body value.
 *
 * @param {string} body Already computed body for OAuth request. Custom properties are appended at the end of OAuth string.
 * @param {OAuth2CustomData} data Value of settings' `customData` property
 * @return {string} Request body
 */
export function applyCustomSettingsBody(body, data) {
  if (!data || !data.token || !data.token.body) {
    return body;
  }
  const params = data.token.body.map((item) => {
    let { value } = item;
    if (value) {
      value = encodeURIComponent(value);
    } else {
      value = '';
    }
    return `${encodeURIComponent(item.name)}=${value}`;
  }).join('&');
  return `${body}&${params}`;
}

/**
 * Applies custom headers from the settings object
 *
 * @param {object} headers A regular JS map with headers definition
 * @param {OAuth2CustomData} data Value of settings' `customData` property
 * @returns {object} The copy of the headers object, if it was altered. Otherwise the same object.
 */
export function applyCustomSettingsHeaders(headers, data) {
  if (!data || !data.token || !data.token.headers) {
    return headers;
  }
  const copy = { ...headers };
  data.token.headers.forEach((item) => {
    copy[item.name] = item.value;
  });
  return copy;
}