# sitespeed.io plugin for InfluxDB
Store data in InfluxDB from sitespeed.io. This plugin was included in sitespeed.io before sitespeed.io 37 was released. After that version you need to install it yourself.
 
## Install the plugin
If you use Node.js the simplest way is to install the plugin globally: `npm install @sitespeed.io/plugin-influxdb -g`


## Run the plugin
And then run sitespeed.io adding the plugin using the package name: `sitespeed.io --plugins.add @sitespeed.io/plugin-influxdb --influxdb.host YOUR_HOST https://www.sitespeed.io`

## CLI help
To see the command line options using help:
`sitespeed.io --plugins.add @sitespeed.io/plugin-influxdb --help`