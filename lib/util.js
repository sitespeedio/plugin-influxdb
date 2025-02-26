import { parse } from 'node:url';
import { format } from 'node:util';

import get from 'lodash.get';
import { getLogger } from '@sitespeed.io/log';

const log = getLogger('sitespeedio.plugin.influxdb');

function joinNonEmpty(strings, delimeter) {
  return strings.filter(Boolean).join(delimeter);
}

function isNumericString(n) {
  // eslint-disable-next-line unicorn/prefer-number-properties
  return !isNaN(Number.parseFloat(n)) && isFinite(n);
}

export function toSafeKey(key, safeChar = '_') {
  return key.replaceAll(/[ %&+,./:?|~–]|%7C/g, safeChar);
}

export function getConnectivity(options) {
  let connectivity = get(options, 'browsertime.connectivity.alias');
  return connectivity
    ? toSafeKey(connectivity.toString())
    : get(options, 'browsertime.connectivity.profile', 'unknown');
}

export function getTagsAsString(tags) {
  return '"' + tags.join(',') + '"';
}

export function getURLAndGroup(
  options,
  group,
  url,
  includeQueryParameters,
  alias
) {
  if (
    group &&
    options.urlsMetaData &&
    options.urlsMetaData[url] &&
    options.urlsMetaData[url].urlAlias
  ) {
    let alias = options.urlsMetaData[url].urlAlias;
    return toSafeKey(group) + '.' + toSafeKey(alias);
  } else if (alias && alias[url]) {
    return toSafeKey(group) + '.' + toSafeKey(alias[url]);
  } else {
    return keypathFromUrl(url, includeQueryParameters, options.useHash, group);
  }
}

function keypathFromUrl(url, includeQueryParameters, useHash, group) {
  function flattenQueryParameters(parameters) {
    return Object.keys(parameters).reduce(
      (result, key) => joinNonEmpty([result, key, parameters[key]], '_'),
      ''
    );
  }

  url = parse(url, !!includeQueryParameters);

  let path = toSafeKey(url.pathname);

  if (includeQueryParameters) {
    path = joinNonEmpty(
      [path, toSafeKey(flattenQueryParameters(url.query))],
      '_'
    );
  }
  if (useHash && url.hash) {
    path = joinNonEmpty([path, toSafeKey(url.hash)], '_');
  }

  const keys = [toSafeKey(group || url.hostname), path];

  return joinNonEmpty(keys, '.');
}

export function getAnnotationMessage(
  absolutePagePath,
  screenShotsEnabledInBrowsertime,
  screenshotType,
  usingBrowsertime,
  options
) {
  const screenshotSize = options.mobile ? 'height=200px' : 'width=100%';
  const resultPageUrl = absolutePagePath + 'index.html';
  let screenshotPath;
  if (screenShotsEnabledInBrowsertime) {
    screenshotPath =
      absolutePagePath +
      'data/screenshots/1/afterPageCompleteCheck.' +
      screenshotType;
  }

  const screenshotsEnabledForDatasource =
    options.graphite.annotationScreenshot ||
    options.influxdb.annotationScreenshot ||
    options.grafana.annotationScreenshot;
  const harPath =
    absolutePagePath +
    'data/' +
    (usingBrowsertime ? 'browsertime.har' : 'webpagetest.har') +
    (options.gzipHAR ? '.gz' : '');

  const extraMessage =
    options.graphite.annotationMessage ||
    options.influxdb.annotationMessage ||
    options.grafana.annotationMessage ||
    undefined;

  const s = options.browsertime.iterations > 1 ? 's' : '';

  let message =
    screenShotsEnabledInBrowsertime && screenshotsEnabledForDatasource
      ? `<a href='${resultPageUrl}' target='_blank'><img src='${screenshotPath}' ${screenshotSize}></a><p><a href='${resultPageUrl}'>Result</a> - <a href='${harPath}'>Download HAR</a></p>`
      : `<a href='${resultPageUrl}' target='_blank'>Result ${options.browsertime.iterations} run${s}</a>`;

  if (extraMessage) {
    message = message + ' - ' + extraMessage;
  }
  return message;
}

export function throwIfMissing(options, keys, namespace) {
  let missingKeys = keys.filter(key => !options[key]);
  if (missingKeys.length > 0) {
    throw new Error(
      format(
        'Required option(s) %s need to be specified in namespace "%s"',
        missingKeys.map(s => '"' + s + '"'),
        namespace
      )
    );
  }
}

export function isEmpty(value) {
  if (value === null) return true;

  if (value === undefined) return true;

  if (typeof value === 'boolean') return false;

  if (typeof value === 'number') return false;

  if (typeof value === 'string') return value.length === 0;

  if (typeof value === 'function') return false;

  if (Array.isArray(value)) return value.length === 0;

  if (value instanceof Map || value instanceof Set) return value.size === 0;

  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }

  return false;
}

export function flattenMessageData({ data, type }) {
  function recursiveFlatten(target, keyPrefix, value) {
    // super simple version to avoid flatten HAR and screenshot data
    if (/(screenshots\.|har\.)/.test(keyPrefix)) {
      return;
    }

    // Google is overloading User Timing marks
    // See https://github.com/sitespeedio/browsertime/issues/257
    if (keyPrefix.includes('userTimings.marks.goog_')) {
      return;
    }

    // Google is overloading User Timing marks = the same using WebPageTest
    // See https://github.com/sitespeedio/browsertime/issues/257
    if (keyPrefix.includes('userTimes.goog_')) {
      return;
    }

    // Hack to remove visual progress from default metrics
    if (keyPrefix.includes('visualMetrics.VisualProgress')) {
      return;
    }

    if (keyPrefix.includes('visualMetrics.videoRecordingStart')) {
      return;
    }

    const valueType = typeof value;

    switch (valueType) {
      case 'number': {
        {
          if (Number.isFinite(value)) {
            target[keyPrefix] = value;
          } else {
            log.warn(
              `Non-finite number '${value}' found at path '${keyPrefix}' for '${type}' message (url = ${data.url})`
            );
          }
        }
        break;
      }
      case 'object': {
        {
          if (value === null) {
            break;
          }

          for (const key of Object.keys(value)) {
            // Hey are you coming to the future from 1980s? Please don't
            // look at this code, it's a ugly hack to make sure we can send assets
            // to Graphite and don't send them with array position, instead
            // use the url to generate the key
            if (type === 'pagexray.pageSummary' && keyPrefix === 'assets') {
              recursiveFlatten(
                target,
                joinNonEmpty(
                  [keyPrefix, toSafeKey(value[key].url || key)],
                  '.'
                ),
                value[key]
              );
            } else {
              recursiveFlatten(
                target,
                joinNonEmpty([keyPrefix, toSafeKey(key)], '.'),
                value[key]
              );
            }
          }
        }
        break;
      }
      case 'string': {
        {
          if (isNumericString(value)) {
            target[keyPrefix] = Number.parseFloat(value);
          }
        }
        break;
      }
      case 'boolean': {
        {
          target[keyPrefix] = value ? 1 : 0;
        }
        break;
      }
      case 'undefined': {
        {
          log.debug(
            `Undefined value found at path '${keyPrefix}' for '${type}' message (url = ${data.url})`
          );
        }
        break;
      }
      default: {
        throw new Error(
          'Unhandled value type ' +
            valueType +
            ' found when flattening data for prefix ' +
            keyPrefix
        );
      }
    }
  }

  let returnValueValue = {};
  recursiveFlatten(returnValueValue, '', data);
  return returnValueValue;
}
