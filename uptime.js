//Raw Node.JS, no dependencies
// Node.JS Version: 0.1.94
var sysmon = require('./core');

// doit.
sysmon.start_server(8080) || sysmon.die('Process Not Started!');
