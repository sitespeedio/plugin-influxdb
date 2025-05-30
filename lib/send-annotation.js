import http from 'node:http';
import https from 'node:https';
import { stringify } from 'node:querystring';

import { getLogger } from '@sitespeed.io/log';
import dayjs from 'dayjs';

import {
  getAnnotationMessage,
  getConnectivity,
  getTagsAsString,
  getURLAndGroup
} from './util.js';

const log = getLogger('sitespeedio.plugin.influxdb');

export function sendV1(
  url,
  group,
  absolutePagePath,
  screenShotsEnabledInBrowsertime,
  screenshotType,
  runTime,
  alias,
  usingBrowsertime,
  options
) {
  // The tags make it possible for the dashboard to use the
  // templates to choose which annotations that will be showed.
  // That's why we need to send tags that matches the template
  // variables in Grafana.
  const connectivity = getConnectivity(options);
  const browser = options.browser;
  const urlAndGroup = getURLAndGroup(
    options,
    group,
    url,
    options.influxdb.includeQueryParams,
    alias
  ).split('.');
  let tags = [connectivity, browser, urlAndGroup[0], urlAndGroup[1]];

  if (options.slug) {
    tags.push(options.slug);
  }

  const message = getAnnotationMessage(
    absolutePagePath,
    screenShotsEnabledInBrowsertime,
    screenshotType,
    usingBrowsertime,
    options
  );
  const timestamp = runTime
    ? Math.round(dayjs(runTime) / 1000)
    : Math.round(dayjs() / 1000);
  // if we have a category, let us send that category too
  if (options.influxdb.tags) {
    for (let row of options.influxdb.tags.split(',')) {
      const keyAndValue = row.split('=');
      tags.push(keyAndValue[1]);
    }
  }
  const influxDBTags = getTagsAsString(tags);
  const postData = `events title="Sitespeed.io",text="${message}",tags=${influxDBTags} ${timestamp}`;
  const postOptions = {
    hostname: options.influxdb.host,
    port: options.influxdb.port,
    path: '/write?db=' + options.influxdb.database + '&precision=s',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  if (options.influxdb.username) {
    postOptions.path =
      postOptions.path +
      '&' +
      stringify({
        u: options.influxdb.username,
        p: options.influxdb.password
      });
  }

  return new Promise((resolve, reject) => {
    log.debug('Send annotation to Influx: %j', postData);
    // not perfect but maybe work for us
    const library = options.influxdb.protocol === 'https' ? https : http;
    const request = library.request(postOptions, res => {
      if (res.statusCode === 204) {
        res.setEncoding('utf8');
        log.debug('Sent annotation to InfluxDB');
        resolve();
      } else {
        const e = new Error(
          `Got ${res.statusCode} from InfluxDB when sending annotation ${res.statusMessage}`
        );
        log.warn(e.message);
        reject(e);
      }
    });
    request.on('error', error => {
      log.error('Got error from InfluxDB when sending annotation', error);
      reject(error);
    });
    request.write(postData);
    request.end();
  });
}
