# Relisten for Sonos

[![Build Status](https://ci.alecgorge.com/job/RelistenNet/job/relisten-sonos/job/master/badge/icon)](https://ci.alecgorge.com/job/RelistenNet/job/relisten-sonos/job/master/)

## Introduction

It's Relisten.net.. for Sonos.

Please contact team@relisten.net with your feedback. Thank you!

## Development

```
# install yarn (mac: brew install yarn)
$ yarn
$ node server.js
```

## Sonos Setup

https://gist.github.com/switz/02cc1f865356bdbba5f5213dab38cc63

## License

MIT

### curl

curl 'http://192.168.0.20:1400/customsd' -X POST -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8' -H 'Accept-Language: en-US,en;q=0.5' -H 'Accept-Encoding: gzip, deflate' -H 'Content-Type: application/x-www-form-urlencoded' -H 'Origin: http://192.168.0.20:1400' -H 'DNT: 1' -H 'Connection: keep-alive' -H 'Referer: http://192.168.0.20:1400/customsd.htm' -H 'Upgrade-Insecure-Requests: 1' -H 'Sec-GPC: 1' --data-raw 'csrfToken=V0RIbyBGqwbi0mkoF7joP6JMgIA4IVVr&sid=240&name=Relisten+%28240%29&secureUri=http%3A%2F%2F192.168.0.19%3A3000%2Fmp3&pollInterval=5&authType=Anonymous&stringsVersion=1&stringsUri=http%3A%2F%2F192.168.0.19%3A3000%2Fstatic%2Fstrings.xml&presentationMapVersion=1&presentationMapUri=http%3A%2F%2F192.168.0.19%3A3000%2Fstatic%2Fpresentationmap.xml&manifestVersion=0&manifestUri=&containerType=MService&caps=search&caps=logging&caps=playbackLogging&caps=extendedMD'
