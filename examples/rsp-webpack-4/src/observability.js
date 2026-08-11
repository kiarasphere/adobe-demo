/**
 * Datadog Browser RUM + Logs bootstrap for rsp-webpack-4.
 * Keep behavior aligned with examples/datadog/observability.js
 */

import {datadogLogs} from '@datadog/browser-logs';
import {datadogRum} from '@datadog/browser-rum';

export const SERVICE_DEFAULT = 'adobe-demo';
export const SITE_DEFAULT = 'us5.datadoghq.com';
export const ENV_DEFAULT = 'dev';
export const VERSION_DEFAULT = '1.0.0';

let _initialized = false;
let _logs = null;

function envSource(env) {
  if (env) {
    return env;
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env;
  }
  return {};
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

export function readConfig(env) {
  const source = envSource(env);
  return {
    applicationId: firstNonEmpty(source, [
      'REACT_APP_DD_APPLICATION_ID',
      'DD_APPLICATION_ID',
      'DD_RUM_APPLICATION_ID'
    ]),
    clientToken: firstNonEmpty(source, [
      'REACT_APP_DD_CLIENT_TOKEN',
      'DD_CLIENT_TOKEN',
      'DD_RUM_CLIENT_TOKEN'
    ]),
    site: firstNonEmpty(source, ['REACT_APP_DD_SITE', 'DD_SITE']) || SITE_DEFAULT,
    service: firstNonEmpty(source, ['REACT_APP_DD_SERVICE', 'DD_SERVICE']) || SERVICE_DEFAULT,
    env: firstNonEmpty(source, ['REACT_APP_DD_ENV', 'DD_ENV']) || ENV_DEFAULT,
    version: firstNonEmpty(source, ['REACT_APP_DD_VERSION', 'DD_VERSION']) || VERSION_DEFAULT,
    sessionSampleRate: Number(
      firstNonEmpty(source, ['REACT_APP_DD_SESSION_SAMPLE_RATE', 'DD_SESSION_SAMPLE_RATE']) || 100
    ),
    enabled: flagEnabled(firstNonEmpty(source, ['REACT_APP_DD_RUM_ENABLED', 'DD_RUM_ENABLED']), true)
  };
}

export function serviceName(env) {
  return readConfig(env).service;
}

export function isConfigured(config) {
  return Boolean(config && config.enabled && config.applicationId && config.clientToken);
}

export function initDatadog() {
  const config = readConfig();

  if (_initialized) {
    return {initialized: true, config, reason: 'already-initialized'};
  }

  if (!isConfigured(config)) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.info(
        '[adobe-demo] Datadog RUM skipped (set DD_APPLICATION_ID + DD_CLIENT_TOKEN). service=%s',
        config.service
      );
    }
    return {initialized: false, config, reason: 'missing-credentials-or-disabled'};
  }

  const common = {
    clientToken: config.clientToken,
    site: config.site,
    service: config.service,
    env: config.env,
    version: config.version,
    sessionSampleRate: Number.isFinite(config.sessionSampleRate) ? config.sessionSampleRate : 100
  };

  datadogRum.init({
    applicationId: config.applicationId,
    ...common,
    trackResources: true,
    trackLongTasks: true,
    trackUserInteractions: true,
    defaultPrivacyLevel: 'mask-user-input'
  });

  datadogLogs.init({
    ...common,
    forwardErrorsToLogs: true,
    forwardConsoleLogs: ['error'],
    sessionSampleRate: common.sessionSampleRate
  });

  _logs = datadogLogs;
  _initialized = true;

  datadogLogs.logger.info('adobe-demo Datadog browser instrumentation initialized', {
    service: config.service,
    env: config.env,
    version: config.version,
    site: config.site
  });

  if (typeof window !== 'undefined') {
    window.__adobeDemoReportError = (message = 'adobe-demo demo error') => {
      reportError(String(message), {source: 'manual'});
    };
  }

  return {initialized: true, config};
}

export function reportError(message, context = {}) {
  if (_logs && _logs.logger) {
    _logs.logger.error(message, {
      service: serviceName(),
      ...context
    });
    return true;
  }
  return false;
}
