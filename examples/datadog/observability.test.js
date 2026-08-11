import assert from 'node:assert/strict';
import {beforeEach, describe, it} from 'node:test';
import {
  SERVICE_DEFAULT,
  SITE_DEFAULT,
  initDatadog,
  isConfigured,
  readConfig,
  reportError,
  serviceName,
  _resetForTests
} from './observability.js';

function mockSdk() {
  const calls = {rumInit: [], logsInit: [], errors: [], infos: []};
  return {
    calls,
    datadogRum: {
      init: (cfg) => {
        calls.rumInit.push(cfg);
      }
    },
    datadogLogs: {
      init: (cfg) => {
        calls.logsInit.push(cfg);
      },
      logger: {
        info: (msg, ctx) => {
          calls.infos.push({msg, ctx});
        },
        error: (msg, ctx) => {
          calls.errors.push({msg, ctx});
        }
      }
    }
  };
}

describe('adobe-demo Datadog observability', () => {
  beforeEach(() => {
    _resetForTests();
  });

  it('defaults service to adobe-demo and site to us5', () => {
    const config = readConfig({});
    assert.equal(config.service, SERVICE_DEFAULT);
    assert.equal(config.service, 'adobe-demo');
    assert.equal(config.site, SITE_DEFAULT);
    assert.equal(config.site, 'us5.datadoghq.com');
    assert.equal(serviceName({}), 'adobe-demo');
  });

  it('reads REACT_APP_ and DD_ env vars', () => {
    const config = readConfig({
      REACT_APP_DD_APPLICATION_ID: 'app-1',
      DD_CLIENT_TOKEN: 'token-1',
      DD_SERVICE: 'adobe-demo',
      DD_ENV: 'staging',
      DD_SITE: 'us5.datadoghq.com'
    });
    assert.equal(config.applicationId, 'app-1');
    assert.equal(config.clientToken, 'token-1');
    assert.equal(config.env, 'staging');
    assert.equal(isConfigured(config), true);
  });

  it('is not configured without credentials', () => {
    assert.equal(isConfigured(readConfig({})), false);
    const result = initDatadog({env: {}});
    assert.equal(result.initialized, false);
    assert.equal(result.reason, 'missing-credentials-or-disabled');
  });

  it('initializes RUM + logs with unified service tags', () => {
    const {datadogRum, datadogLogs, calls} = mockSdk();
    const result = initDatadog({
      env: {
        DD_APPLICATION_ID: 'app-id',
        DD_CLIENT_TOKEN: 'client-token',
        DD_SERVICE: 'adobe-demo',
        DD_ENV: 'dev',
        DD_VERSION: '1.2.3',
        DD_SITE: 'us5.datadoghq.com'
      },
      datadogRum,
      datadogLogs
    });

    assert.equal(result.initialized, true);
    assert.equal(calls.rumInit.length, 1);
    assert.equal(calls.logsInit.length, 1);
    assert.equal(calls.rumInit[0].service, 'adobe-demo');
    assert.equal(calls.rumInit[0].site, 'us5.datadoghq.com');
    assert.equal(calls.rumInit[0].applicationId, 'app-id');
    assert.equal(calls.logsInit[0].service, 'adobe-demo');
    assert.equal(calls.logsInit[0].forwardErrorsToLogs, true);
    assert.ok(calls.infos.length >= 1);
  });

  it('is idempotent', () => {
    const {datadogRum, datadogLogs, calls} = mockSdk();
    const opts = {
      env: {
        DD_APPLICATION_ID: 'app-id',
        DD_CLIENT_TOKEN: 'client-token'
      },
      datadogRum,
      datadogLogs
    };
    assert.equal(initDatadog(opts).initialized, true);
    assert.equal(initDatadog(opts).reason, 'already-initialized');
    assert.equal(calls.rumInit.length, 1);
  });

  it('reportError tags service and uses browser logger', () => {
    const {datadogRum, datadogLogs, calls} = mockSdk();
    initDatadog({
      env: {
        DD_APPLICATION_ID: 'app-id',
        DD_CLIENT_TOKEN: 'client-token'
      },
      datadogRum,
      datadogLogs,
      emitStartupLog: false
    });
    assert.equal(reportError('boom', {source: 'test'}), true);
    assert.equal(calls.errors.length, 1);
    assert.equal(calls.errors[0].msg, 'boom');
    assert.equal(calls.errors[0].ctx.service, 'adobe-demo');
  });
});
