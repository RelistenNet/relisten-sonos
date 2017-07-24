# Relisten for Sonos

## Introduction

It's Relisten.net.. for Sonos. This is a work in progress, but it does work.

Please contact admin@relisten.net with your feedback. Thank you!

## Development

```
$ npm i
// run mysql server with iguana schema (https://github.com/alecgorge/iguana)
$ node server.js
```

## Sonos Setup

```
WARNING: You can only have one custom music service on Sonos at a time.
         If you already have gone through this process it will replace your existing custom service.
         If not, you're all good. Move ahead.
         (edit: You can try changing the SID to another number like 251 and it should work, but we haven't tested this extensively)


   1. Open the Sonos client on your computer
   2. Select Help > About My Sonos System
   3. Find the IP address of your Play:3 or Play:5 in the list of the about
   dialog
   4. Open your browser of choice and navigate to the IP address and port
   1400, with the filename of customsd.htm. For example, if your IP address is
   10.10.10.10, navigate to http://10.10.10.10:1400/customsd.htm.
   5. Enter entries for the following fields and press submit:
      -
         - SID: 255
         - Service Name: Relisten
         - Endpoint URL: http://relisten-sonos.alecgorge.com/wsdl (use http://[router IP]:3000 if testing locally)
         - Secure Endpoint URL: https://relisten-sonos.alecgorge.com/wsdl
         - Polling Interval: 60
         - Authentication SOAP header policy: Anonymous
         - Strings table: (leave blank)
         - Presentation Map: Version: 1, Uri: https://relisten-sonos.alecgorge.com/static/presentationmap.xml
         - Container Type: Music Service
         - Capabilities: None
      6. Upon success you should see the text "success!" displayed
   7. Return to your Sonos client application
   7a. Sonos may have automatically added the service.
       Check in your home menu if "Relisten" exists.
       If so, you can stop here and enjoy.
   8. Select Manage > Service Settings...
   9. Select Services, and click the Add button
   10. Under available services, select "Relisten" and click Next
   11. Select "Setup now" or whatever bullshit
   12. You should see a confirmation
```

## License

MIT
