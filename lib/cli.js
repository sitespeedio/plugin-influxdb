export const getInfluxdbOptions = () => ({
  'influxdb.protocol': {
    describe: 'The protocol used to connect to the InfluxDB host.',
    default: 'http',
    group: 'InfluxDB'
  },
  'influxdb.host': {
    describe: 'The InfluxDB host used to store captured metrics.',
    group: 'InfluxDB'
  },
  'influxdb.port': {
    default: 8086,
    describe: 'The InfluxDB port used to store captured metrics.',
    group: 'InfluxDB'
  },
  'influxdb.username': {
    describe:
      'The InfluxDB username for your InfluxDB instance (only for InfluxDB v1).',
    group: 'InfluxDB'
  },
  'influxdb.password': {
    describe:
      'The InfluxDB password for your InfluxDB instance (only for InfluxDB v1).',
    group: 'InfluxDB'
  },
  'influxdb.organisation': {
    describe:
      'The InfluxDB organisation for your InfluxDB instance (only for InfluxDB v2).',
    group: 'InfluxDB'
  },
  'influxdb.token': {
    describe:
      'The InfluxDB token for your InfluxDB instance (only for InfluxDB v2).',
    group: 'InfluxDB'
  },
  'influxdb.version': {
    default: 1,
    describe: 'The InfluxDB version of your InfluxDB instance.',
    type: 'number',
    group: 'InfluxDB'
  },
  'influxdb.database': {
    default: 'sitespeed',
    describe: 'The database name used to store captured metrics.',
    group: 'InfluxDB'
  },
  'influxdb.tags': {
    default: 'category=default',
    describe: 'A comma separated list of tags and values added to each metric',
    group: 'InfluxDB'
  },
  'influxdb.includeQueryParams': {
    default: false,
    describe:
      'Whether to include query parameters from the URL in the InfluxDB keys or not',
    type: 'boolean',
    group: 'InfluxDB'
  },
  'influxdb.groupSeparator': {
    default: '_',
    describe:
      'Character to separate a group/domain. Default is underscore; set it to a dot to preserve the original domain name.',
    group: 'InfluxDB'
  },
  'influxdb.annotationScreenshot': {
    default: false,
    type: 'boolean',
    describe:
      'Include screenshot (from Browsertime) in the annotation. Requires a --resultBaseURL to work.',
    group: 'InfluxDB'
  }
});
