
//
// rem client.cmd
// node client.js website_url ...
//
// On a Unix machine this would allow automatic execution after chmod a+x hello.js
// #!/usr/bin/env node
//

//
//   Copyright (C) 2014 Menlo Park Innovation LLC
//
//   menloparkinnovation.com
//   menloparkinnovation@gmail.com
//
//   Licensed under the Apache License, Version 2.0 (the "License");
//   you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
//       http://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing, software
//   distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
//   limitations under the License.
//

//
//   client.js
//
//   Openpux Internet Of Things (IOT) Framework.
//
//   Copyright (C) 2014 Menlo Park Innovation LLC
//
//   menloparkinnovation.com
//   menloparkinnovation@gmail.com
//
//   Snapshot License
//
//   This license is for a specific snapshot of a base work of
//   Menlo Park Innovation LLC on a non-exclusive basis with no warranty
//   or obligation for future updates. This work, any portion, or derivative
//   of it may be made available under other license terms by
//   Menlo Park Innovation LLC without notice or obligation to this license.
//
//   There is no warranty, statement of fitness, statement of
//   fitness for any purpose, and no statements as to infringements
//   on any patents.
//
//   Menlo Park Innovation has no obligation to offer support, updates,
//   future revisions and improvements, source code, source code downloads,
//   media, etc.
//
//   This specific snapshot is made available under the terms of
//   the Apache License Version 2.0 of January 2004
//   http://www.apache.org/licenses/
//

console.log("openpux node.js client:");

//console.log(process.argv);

//
// The arguments passed to node.exe are:
//
// [0] executable_name
// [1] node_script_path.js
// [2] first user arg
// [3] second user arg
//    ...
//
// Remove argv[0], argv[1] to get to the base of the user supplied arguments
var args = process.argv.slice(2);

// This will dump the args in JSON
//console.log("process.argv.slice(2)");
console.log(args);

//var opclient = require('openpuxclient.js');
//var opclient = require('openpuxclient');

//processSensorQuery();

function processSensorQuery() {

    // Scheme is unsecured http vs. https
    var scheme = "http";

    // Get host from the browsers environment
    var host = "www.smartpux.com"

    // no http auth information
    var httpauthusername = null;
    var httpauthpassword = null;

    // Get form inputs
    var accountid = "1";
    var passcode = "12345678";
    var sensorid = "1";

    var readingcount = 10;
    var startdate = "";
    var enddate = "";

    if (readingcount == null) readingcount = 1;

    // openpuxclient.js
    result = querySensorReadings(
        scheme,
        host,
        httpauthusername,
        httpauthpassword,
        processSensorQueryFormResponse,
        accountid,
        passcode,
        sensorid,
        readingcount,
        startdate,
        enddate
        );

    if (result != null) {
      alert("Local Error Status: " + result);
    }
}

//
// Do not exit the script here if any async event
// handlers were setup above. Otherwise the program
// will terminate before they get a chance to run, or
// finish running.
//
// Doing a process.exit(0); here will stop before any
// processing occurs.
//
// Node.js will continue to run while handlers are outstanding.
//
// It appears to exit when everything is done.
//


