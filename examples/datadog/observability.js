/**
 * Datadog Browser RUM + Logs for adobe-demo demo surfaces.
 *
 * Canonical service name: adobe-demo (no prior DD_SERVICE / service tag existed in-repo).
 * Site: us5.datadoghq.com
 *
 * Safe to call without credentials — init is a no-op until application id + client token
 * are provided via env (see .env.example). Pure static SPAs do not emit APM
 * `trace.http.request.*`; this module emits RUM views/resources/actions/errors and
 * browser logs tagged with the same service.
 *
 * IMPORTANT (CRA / webpack): read `process.env.REACT_APP_DD_*` / `process.env.DD_*` via
 * static member access so DefinePlugin can inline them. Do not gate on
 * `typeof process !== 'undefined'` or read from a dynamic `process.env[key]` map —
 * in the browser bundle `process` is often undefined as an object even though
 * individual `process.env.X` references were replaced at build time.
 */

export const SERVICE_DEFAULT = 'adobe-demo';
export const SITE_DEFAULT = 'us5.datadoghq.com';
export const ENV_DEFAULT = 'dev';
export const VERSION_DEFAULT = '1.0.0';

let _initialized = false;
let _logs = null;
let _rum = null;

function nonEmpty(...values) {
  for (const value of values) {
    if (value != null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return undefined;
}

function firstNonEmpty(source, keys) {
  for (const key of keys) {
    const value = source[key];
    if (value != null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return undefined;
}

function flagEnabled(raw, defaultValue = true) {
  if (raw == null || String(raw).trim() === '') {
    return defaultValue;
  }
  return !['0', 'false', 'no', 'off'].includes(String(raw).trim().toLowerCase());
}

/**
 * Read Datadog browser config from CRA (`REACT_APP_*`) or plain `DD_*` env vars.
 * Pass `env` only in tests; production paths must use static process.env.* reads.
 */
export function readConfig(env) {
  if (env) {
    return {
      applicationId: firstNonEmpty(env, [
        'REACT_APP_DD_APPLICATION_ID',
        'DD_APPLICATION_ID',
        'DD_RUM_APPLICATION_ID'
      ]),
      clientToken: firstNonEmpty(env, [
        'REACT_APP_DD_CLIENT_TOKEN',
        'DD_CLIENT_TOKEN',
        'DD_RUM_CLIENT_TOKEN'
      ]),
      site: firstNonEmpty(env, ['REACT_APP_DD_SITE', 'DD_SITE']) || SITE_DEFAULT,
      service: firstNonEmpty(env, ['REACT_APP_DD_SERVICE', 'DD_SERVICE']) || SERVICE_DEFAULT,
      env: firstNonEmpty(env, ['REACT_APP_DD_ENV', 'DD_ENV']) || ENV_DEFAULT,
      version: firstNonEmpty(env, ['REACT_APP_DD_VERSION', 'DD_VERSION']) || VERSION_DEFAULT,
      sessionSampleRate: Number(
        firstNonEmpty(env, ['REACT_APP_DD_SESSION_SAMPLE_RATE', 'DD_SESSION_SAMPLE_RATE']) || 100
      ),
      enabled: flagEnabled(firstNonEmpty(env, ['REACT_APP_DD_RUM_ENABLED', 'DD_RUM_ENABLED']), true)
    };
  }

  // Static member access — required for CRA / webpack DefinePlugin inlining.
  return {
    applicationId: nonEmpty(
      process.env.REACT_APP_DD_APPLICATION_ID,
      process.env.DD_APPLICATION_ID,
      process.env.DD_RUM_APPLICATION_ID
    ),
    clientToken: nonEmpty(
      process.env.REACT_APP_DD_CLIENT_TOKEN,
      process.env.DD_CLIENT_TOKEN,
      process.env.DD_RUM_CLIENT_TOKEN
    ),
    site: nonEmpty(process.env.REACT_APP_DD_SITE, process.env.DD_SITE) || SITE_DEFAULT,
    service: nonEmpty(process.env.REACT_APP_DD_SERVICE, process.env.DD_SERVICE) || SERVICE_DEFAULT,
    env: nonEmpty(process.env.REACT_APP_DD_ENV, process.env.DD_ENV) || ENV_DEFAULT,
    version: nonEmpty(process.env.REACT_APP_DD_VERSION, process.env.DD_VERSION) || VERSION_DEFAULT,
    sessionSampleRate: Number(
      nonEmpty(process.env.REACT_APP_DD_SESSION_SAMPLE_RATE, process.env.DD_SESSION_SAMPLE_RATE) || 100
    ),
    enabled: flagEnabled(nonEmpty(process.env.REACT_APP_DD_RUM_ENABLED, process.env.DD_RUM_ENABLED), true)
  };
}

export function serviceName(env) {
  return readConfig(env).service;
}

export function isConfigured(config) {
  return Boolean(config && config.enabled && config.applicationId && config.clientToken);
}

/**
 * Initialize Datadog RUM + browser logs. Idempotent.
 *
 * @param {object} [options]
 * @param {object} [options.env] - env map (for tests)
 * @param {object} [options.config] - overrides for readConfig()
 * @param {object} [options.datadogRum] - inject @datadog/browser-rum (tests / CDN)
 * @param {object} [options.datadogLogs] - inject @datadog/browser-logs (tests / CDN)
 * @param {boolean} [options.emitStartupLog=true]
 * @returns {{ initialized: boolean, config: object, reason?: string }}
 */
export function initDatadog(options = {}) {
  const config = {...readConfig(options.env), ...(options.config || {})};

  if (_initialized) {
    return {initialized: true, config, reason: 'already-initialized'};
  }

  if (!isConfigured(config)) {
    return {
      initialized: false,
      config,
      reason: 'missing-credentials-or-disabled'
    };
  }

  const rum = options.datadogRum;
  const logs = options.datadogLogs;
  if (!rum || !logs || typeof rum.init !== 'function' || typeof logs.init !== 'function') {
    return {
      initialized: false,
      config,
      reason: 'sdk-unavailable'
    };
  }

  const common = {
    clientToken: config.clientToken,
    site: config.site,
    service: config.service,
    env: config.env,
    version: config.version,
    sessionSampleRate: Number.isFinite(config.sessionSampleRate) ? config.sessionSampleRate : 100
  };

  rum.init({
    applicationId: config.applicationId,
    ...common,
    trackResources: true,
    trackLongTasks: true,
    trackUserInteractions: true,
    defaultPrivacyLevel: 'mask-user-input'
  });

  logs.init({
    ...common,
    forwardErrorsToLogs: true,
    forwardConsoleLogs: ['error'],
    // Match RUM session so logs correlate in US5.
    sessionSampleRate: common.sessionSampleRate
  });

  _rum = rum;
  _logs = logs;
  _initialized = true;

  if (options.emitStartupLog !== false && logs.logger && typeof logs.logger.info === 'function') {
    logs.logger.info('adobe-demo Datadog browser instrumentation initialized', {
      service: config.service,
      env: config.env,
      version: config.version,
      site: config.site
    });
  }

  if (typeof window !== 'undefined') {
    // Manual verification helper: window.__adobeDemoReportError('boom')
    window.__adobeDemoReportError = (message = 'adobe-demo demo error') => {
      reportError(String(message), {source: 'manual'});
    };
  }

  return {initialized: true, config};
}

/**
 * Emit an error log tagged with service:adobe-demo (no-op if not initialized).
 */
export function reportError(message, context = {}) {
  if (_logs && _logs.logger && typeof _logs.logger.error === 'function') {
    _logs.logger.error(message, {
      service: serviceName(),
      ...context
    });
    return true;
  }
  return false;
}

/** @private test helper */
export function _resetForTests() {
  _initialized = false;
  _logs = null;
  _rum = null;
  if (typeof window !== 'undefined') {
    delete window.__adobeDemoReportError;
  }
}
