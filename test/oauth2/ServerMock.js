async function readBody(ctx) {
  const { req } = ctx;
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
  
    req.on('end', () => {
      resolve(data);
    });
  });
}

const acceptableClientIds = ['auth-code-cid', 'custom-scopes', 'custom-data'];
const acceptableCodes = ['response-code-1234abc'];
const acceptableSecrets = ['auth-code-cs', 'cc-secret'];

const responseToken = 'token1234';
const refreshToken = 'refresh1234';
const formContentType = 'application/x-www-form-urlencoded';
const customScopes = 'c1 c2';

module.exports.CodeServerMock = {
  authRequest(request) {
    const { url } = request;
    const query = url.replace('/auth-code?', '');
    const params = new URLSearchParams(query);
    const redirect = params.get('redirect_uri');
    const state = params.get('state');
    const scope = params.get('scope');
    const clientId = params.get('client_id');
    let code = 'response-code-1234abc';
    if (clientId === 'invalid-code') {
      code = 'invalid';
    }

    const newUrl = new URL(redirect);
    newUrl.searchParams.set('state', state);
    newUrl.searchParams.set('code', code);
    if (scope) {
      newUrl.searchParams.set('scope', scope);
    }
    let body = '<!DOCTYPE html><html lang="en"><head></head>';
    body += '<body><h1>Auth server</h1>';
    body += `<meta http-equiv="refresh" content="0;url=${newUrl.toString()}">`;
    body += '</body></html>';
    return { 
      body, 
      type: 'text/html',
    };
  },

  authRequestCustom(request) {
    const { url } = request;
    const query = url.replace('/auth-code?', '');
    
    const params = new URLSearchParams(query);
    const state = params.get('state');
    const custom = params.get('customQuery');
    const redirect = params.get('redirect_uri');

    const newUrl = new URL(redirect);
    newUrl.searchParams.set('state', state);
    newUrl.searchParams.set('code', custom);
    
    let body = '<!DOCTYPE html><html lang="en"><head></head>';
    body += '<body><h1>Auth server</h1>';
    body += `<meta http-equiv="refresh" content="0;url=${newUrl.toString()}">`;
    body += '</body></html>';
    return { 
      body, 
      type: 'text/html',
    };
  },

  async authRequestImplicit(ctx) {
    const { url } = ctx.request;
    const query = url.replace('/oauth2/auth-implicit?', '');
    const params = new URLSearchParams(query);
    const redirect = params.get('redirect_uri');
    const state = params.get('state');
    const scope = params.get('scope');
    const cid = params.get('client_id');
    
    const newUrl = new URL(redirect);
    newUrl.searchParams.set('state', state);

    if (!acceptableClientIds.includes(cid)) {
      newUrl.searchParams.set('error', 'invalid_client');
    } else {
      newUrl.searchParams.set('access_token', responseToken);
      newUrl.searchParams.set('refresh_token', refreshToken);
      newUrl.searchParams.set('expires_in', '3600');
      if (cid === 'custom-scopes') {
        newUrl.searchParams.set('scope', customScopes);
      } else if (scope) {
        newUrl.searchParams.set('scope', scope);
      }
    }
    const final = `${redirect}#${newUrl.searchParams.toString()}`;
    ctx.status = 301;
    ctx.redirect(final);
  },

  async authRequestImplicitCustom(ctx) {
    const { url } = ctx.request;
    const query = url.replace('/oauth2/auth-implicit-custom?', '');
    const params = new URLSearchParams(query);
    const redirect = params.get('redirect_uri');
    const state = params.get('state');
    const custom = params.get('customQuery');
    
    const newUrl = new URL(redirect);
    newUrl.searchParams.set('state', state);
    
    if (custom !== 'customQueryValue') {
      newUrl.searchParams.set('error', 'invalid_client');
    } else {
      newUrl.searchParams.set('access_token', responseToken);
      newUrl.searchParams.set('refresh_token', refreshToken);
      newUrl.searchParams.set('expires_in', '3600');
    }
    const final = `${redirect}#${newUrl.searchParams.toString()}`;
    ctx.status = 301;
    ctx.redirect(final);
  },

  async authRequestImplicitStateError(ctx) {
    const { url } = ctx.request;
    const query = url.replace('/oauth2/auth-implicit-invalid-state?', '');
    const params = new URLSearchParams(query);
    const redirect = params.get('redirect_uri');
    
    const newUrl = new URL(redirect);
    newUrl.searchParams.set('state', 'OtHeR');
    newUrl.searchParams.set('access_token', responseToken);
    newUrl.searchParams.set('refresh_token', refreshToken);
    newUrl.searchParams.set('expires_in', '3600');
    const final = `${redirect}#${newUrl.searchParams.toString()}`;
    ctx.status = 301;
    ctx.redirect(final);
  },

  async tokenRequest(ctx) {
    const body = await readBody(ctx);
    const params = new URLSearchParams(body);
    const result = new URLSearchParams();
    const cid = params.get('client_id');
    const redirectUri = params.get('redirect_uri');
    const code = params.get('code');
    const secret = params.get('client_secret');
    if (params.get('grant_type') !== 'authorization_code') {
      result.set('error', 'invalid_grant');
    } else if (!acceptableClientIds.includes(cid)) {
      result.set('error', 'invalid_client');
    } else if (!redirectUri.includes('popup.html')) {
      result.set('error', 'invalid_request');
      result.set('error_description', 'invalid redirect');
    } else if (!acceptableCodes.includes(code)) {
      result.set('error', 'invalid_client');
      result.set('error_description', 'invalid code');
    } else if (!acceptableSecrets.includes(secret)) {
      result.set('error', 'invalid_client');
      result.set('error_description', 'invalid secret');
    } else {
      result.set('access_token', responseToken);
      result.set('refresh_token', refreshToken);
      result.set('expires_in', '3600');
      if (cid === 'custom-scopes') {
        result.set('scope', customScopes);
      }
    }
    return { 
      body: result.toString(), 
      type: formContentType,
    };
  },

  async tokenRequestCustom(ctx) {
    const body = await readBody(ctx);

    const params = new URLSearchParams(body);
    const result = new URLSearchParams();

    const code = params.get('code');
    const customBody = params.get('customBody');
    // this comes from `authRequestCustom()` where the code is set to the value of the `customQuery` parameter
    if (code !== 'customQueryValue') {
      result.set('error', 'invalid_request');
      result.set('error_description', 'auth.parameters.customQuery is not set');
    } else if (customBody !== 'customBodyValue') {
      result.set('error', 'invalid_request');
      result.set('error_description', 'token.body.customBody is not set');
    } else if (!ctx.request.url.includes('customParameter=customParameterValue')) {
      result.set('error', 'invalid_request');
      result.set('error_description', 'token.parameters.customParameter is not set');
    } else if (ctx.request.header.customheader !== 'customHeaderValue') {
      result.set('error', 'invalid_request');
      result.set('error_description', 'token.headers.customHeader is not set');
    } else {
      result.set('access_token', responseToken);
      result.set('refresh_token', refreshToken);
      result.set('expires_in', '3600');
    }
    return { 
      body: result.toString(), 
      type: formContentType,
    };
  },

  async tokenPassword(ctx) {
    const body = await readBody(ctx);

    const params = new URLSearchParams(body);
    const result = new URLSearchParams();

    const username = params.get('username');
    const password = params.get('password');
    const cid = params.get('client_id');
    const scope = params.get('scope');
    const customBody = params.get('customBody');

    if (!acceptableClientIds.includes(cid)) {
      result.set('error', 'invalid_client');
      result.set('error_description', 'invalid client id');
    } else if (scope && scope !== 'a b') {
      result.set('error', 'invalid_client');
      result.set('error_description', 'invalid scope');
    } else if (username !== 'test-uname') {
      result.set('error', 'invalid_client');
      result.set('error_description', 'invalid username');
    } else if (password !== 'test-passwd') {
      result.set('error', 'invalid_client');
      result.set('error_description', 'invalid password');
    } else if (cid === 'custom-data' && customBody !== 'customBodyValue') {
      result.set('error', 'invalid_request');
      result.set('error_description', 'token.body.customBody is not set');
    } else if (cid === 'custom-data' && !ctx.request.url.includes('customParameter=customParameterValue')) {
      result.set('error', 'invalid_request');
      result.set('error_description', 'token.parameters.customParameter is not set');
    } else if (cid === 'custom-data' && ctx.request.header.customheader !== 'customHeaderValue') {
      result.set('error', 'invalid_request');
      result.set('error_description', 'token.headers.customHeader is not set');
    } else {
      result.set('access_token', responseToken);
      result.set('refresh_token', refreshToken);
      result.set('expires_in', '3600');
      if (!scope) {
        result.set('scope', 'custom');
      } else {
        result.set('scope', scope);
      }
    }
    return { 
      body: result.toString(), 
      type: formContentType,
    };
  },

  async tokenClientCredentials(ctx) {
    const body = await readBody(ctx);

    const params = new URLSearchParams(body);
    const result = new URLSearchParams();

    const cid = params.get('client_id');
    const scope = params.get('scope');
    const secret = params.get('client_secret');
    const customBody = params.get('customBody');

    if (cid && !acceptableClientIds.includes(cid)) {
      result.set('error', 'invalid_client');
      result.set('error_description', 'invalid client id');
    } else if (secret && !acceptableSecrets.includes(secret)) {
      result.set('error', 'invalid_client');
      result.set('error_description', 'invalid secret');
    } else if (scope && scope !== 'a b') {
      result.set('error', 'invalid_client');
      result.set('error_description', 'invalid scope');
    } else if (cid === 'custom-data' && customBody !== 'customBodyValue') {
      result.set('error', 'invalid_request');
      result.set('error_description', 'token.body.customBody is not set');
    } else if (cid === 'custom-data' && !ctx.request.url.includes('customParameter=customParameterValue')) {
      result.set('error', 'invalid_request');
      result.set('error_description', 'token.parameters.customParameter is not set');
    } else if (cid === 'custom-data' && ctx.request.header.customheader !== 'customHeaderValue') {
      result.set('error', 'invalid_request');
      result.set('error_description', 'token.headers.customHeader is not set');
    } else {
      result.set('access_token', responseToken);
      result.set('refresh_token', refreshToken);
      result.set('expires_in', '3600');
      if (!scope) {
        result.set('scope', 'custom');
      } else {
        result.set('scope', scope);
      }
    }
    return { 
      body: result.toString(), 
      type: formContentType,
    };
  },

  async tokenCustomGrant(ctx) {
    const body = await readBody(ctx);

    const params = new URLSearchParams(body);
    const result = new URLSearchParams();

    const cid = params.get('client_id');
    const grantType = params.get('grant_type');
    const scope = params.get('scope');
    const secret = params.get('client_secret');
    const customBody = params.get('customBody');

    if (grantType !== 'custom-grant') {
      result.set('error', 'invalid_grant');
    } else if (cid && !acceptableClientIds.includes(cid)) {
      result.set('error', 'invalid_client');
      result.set('error_description', 'invalid client id');
    } else if (secret && !acceptableSecrets.includes(secret)) {
      result.set('error', 'invalid_client');
      result.set('error_description', 'invalid secret');
    } else if (scope && scope !== 'a b') {
      result.set('error', 'invalid_client');
      result.set('error_description', 'invalid scope');
    } else if (cid === 'custom-data' && customBody !== 'customBodyValue') {
      result.set('error', 'invalid_request');
      result.set('error_description', 'token.body.customBody is not set');
    } else if (cid === 'custom-data' && !ctx.request.url.includes('customParameter=customParameterValue')) {
      result.set('error', 'invalid_request');
      result.set('error_description', 'token.parameters.customParameter is not set');
    } else if (cid === 'custom-data' && ctx.request.header.customheader !== 'customHeaderValue') {
      result.set('error', 'invalid_request');
      result.set('error_description', 'token.headers.customHeader is not set');
    } else {
      result.set('access_token', responseToken);
      result.set('refresh_token', refreshToken);
      result.set('expires_in', '3600');
      if (!scope) {
        result.set('scope', 'custom');
      } else {
        result.set('scope', scope);
      }
    }
    return { 
      body: result.toString(), 
      type: formContentType,
    };
  },
};