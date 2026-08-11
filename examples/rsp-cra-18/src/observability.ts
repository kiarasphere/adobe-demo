/**
 * Datadog Browser RUM + Logs bootstrap for rsp-cra-18.
 * Keep behavior aligned with examples/datadog/observability.js
 * (CRA ModuleScopePlugin cannot import outside src/).
 *
 * IMPORTANT: read process.env.REACT_APP_DD_* via static member access so CRA can
 * inline values. Do not gate on `typeof process !== 'undefined'` — in the browser
 * bundle `process` is undefined even though DefinePlugin replaced those members.
 */

import {datadogLogs} from '@datadog/browser-logs';
import {datadogRum} from '@datadog/browser-rum';

export const SERVICE_DEFAULT = 'adobe-demo';
export const SITE_DEFAULT = 'us5.datadoghq.com';
export const ENV_DEFAULT = 'dev';
export const VERSION_DEFAULT = '1.0.0';

type EnvMap = Record<string, string | undefined>;

export type DatadogBrowserConfig = {
  applicationId?: string;
  clientToken?: string;
  site: string;
  service: string;
  env: string;
  version: string;
  sessionSampleRate: number;
  enabled: boolean;
};

let _initialized = false;
let _logs: typeof datadogLogs | null = null;

function nonEmpty(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    if (value != null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return undefined;
}

function firstNonEmpty(source: EnvMap, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (value != null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return undefined;
}

function flagEnabled(raw: string | undefined, defaultValue = true): boolean {
  if (raw == null || String(raw).trim() === '') {
    return defaultValue;
  }
  return !['0', 'false', 'no', 'off'].includes(String(raw).trim().toLowerCase());
}

export function readConfig(env?: EnvMap): DatadogBrowserConfig {
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

  // Static member access — required for CRA env inlining in the browser bundle.
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

export function serviceName(env?: EnvMap): string {
  return readConfig(env).service;
}

export function isConfigured(config: DatadogBrowserConfig): boolean {
  return Boolean(config && config.enabled && config.applicationId && config.clientToken);
}

export function initDatadog(): {initialized: boolean; config: DatadogBrowserConfig; reason?: string} {
  const config = readConfig();

  if (_initialized) {
    return {initialized: true, config, reason: 'already-initialized'};
  }

  if (!isConfigured(config)) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.info(
        '[adobe-demo] Datadog RUM skipped (set REACT_APP_DD_APPLICATION_ID + REACT_APP_DD_CLIENT_TOKEN). service=%s',
        config.service
      );
    }
    return {initialized: false, config, reason: 'missing-credentials-or-disabled'};
  }

  const common = {
    clientToken: config.clientToken as string,
    site: config.site,
    service: config.service,
    env: config.env,
    version: config.version,
    sessionSampleRate: Number.isFinite(config.sessionSampleRate) ? config.sessionSampleRate : 100
  };

  datadogRum.init({
    applicationId: config.applicationId as string,
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

  (window as any).__adobeDemoReportError = (message = 'adobe-demo demo error') => {
    reportError(String(message), {source: 'manual'});
  };

  return {initialized: true, config};
}

export function reportError(message: string, context: Record<string, unknown> = {}): boolean {
  if (_logs) {
    _logs.logger.error(message, {
      service: serviceName(),
      ...context
    });
    return true;
  }
  return false;
}
