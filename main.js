/**
 *
 * botvac adapter
 *
 */

/* jshint -W097 */// jshint strict:false
/*jslint node: true */
"use strict";

var utils =     require(__dirname + '/lib/utils'); // Get common adapter utils
var botvac =    require('node-botvac');
var client =    new botvac.Client();
var allRobotNames = [];
var allRobots = {};

// adapter will be restarted automatically every time as the configuration changed, e.g system.adapter.botvac.0
var adapter = utils.adapter('botvac');

// is called when adapter shuts down - callback has to be called under any circumstances!
adapter.on('unload', function (callback) {
    callback();
});

// is called if a subscribed state changes
adapter.on('stateChange', function (id, state) {
    // you can use the ack flag to detect if it is status (true) or command (false)
    if (state && !state.ack) {
        var arr = id.split('.');
        if (arr.length !== 5) {
            return;
        }
        var robotName = arr[2];
        var channel = arr[3];
        var command = arr[4];
        if (allRobotNames.indexOf(robotName) === -1) {
            adapter.log.warn('state change in unknown device: ' + robotName);
            return;
        } else if (channel !== 'commands') {
            adapter.log.warn('state change in unknown channel: ' + channel);
            return;
        }

        switch (command) {
            case 'schedule':
                if (state.val) {
                    allRobots[robotName].enableSchedule(function (error, result) {
                        if (error || result !== 'ok') {
                            adapter.log.warn('cannot enable schedule ' + robotName);
                            adapter.setState(id, false, true);
                            return;
                        }
                        adapter.setState(id, true, true);
                    });
                } else {
                    allRobots[robotName].disableSchedule(function (error, result) {
                        if (error || result !== 'ok') {
                            adapter.log.warn('cannot disable schedule ' + robotName);
                            adapter.setState(id, true, true);
                            return;
                        }
                        adapter.setState(id, false, true);
                    });
                }
                break;
            case 'clean':
                if (!state.val) {
                    adapter.setState(id, false, true);
                    adapter.log.warn('use stop state if you want to stop cleaning ' + robotName);
                    return;
                }
                updateRobot(allRobots[robotName], function (error) {
                    if (error) {
                        return;
                    }
                    if (allRobots[robotName].canStart !== true) {
                        adapter.log.warn('cannot start cleaning ' + robotName);
                        adapter.setState(id, false, true);
                        return;
                    }
                    //start cleaning
                    allRobots[robotName].startCleaning(function (error, result) {
                        if (error || result !== 'ok') {
                            adapter.log.warn('cannot start cleaning (2) ' + robotName);
                            adapter.setState(id, false, true);
                            return;
                        }
                        adapter.setState(id, true, true);
                    });
                });
                break;
            case 'cleanSpot':
                if (!state.val) {
                    adapter.setState(id, false, true);
                    adapter.log.warn('use stop state if you want to stop cleaning ' + robotName);
                    return;
                }
                updateRobot(allRobots[robotName], function (error) {
                    if (error) {
                        return;
                    }
                    if (allRobots[robotName].canStart !== true) {
                        adapter.log.warn('cannot start cleaning ' + robotName);
                        adapter.setState(id, false, true);
                        return;
                    }
                    //start cleaning
                    allRobots[robotName].startSpotCleaning(function (error, result) {
                        if (error || result !== 'ok') {
                            adapter.log.warn('cannot start cleaning (2) ' + robotName);
                            adapter.setState(id, false, true);
                            return;
                        }
                        adapter.setState(id, true, true);
                    });
                });
                break;
            case 'pause':
                if (!state.val) {
                    adapter.setState(id, false, true);
                    adapter.log.warn('use resume or stop state if you want to resume or stop cleaning ' + robotName);
                    return;
                }
                updateRobot(allRobots[robotName], function (error) {
                    if (error) {
                        return;
                    }
                    if (allRobots[robotName].canPause !== true) {
                        adapter.log.warn('cannot pause cleaning ' + robotName);
                        adapter.setState(id, false, true);
                        return;
                    }
                    //pause cleaning
                    allRobots[robotName].pauseCleaning(function (error, result) {
                        if (error || result !== 'ok') {
                            adapter.log.warn('cannot pause cleaning (2) ' + robotName);
                            adapter.setState(id, false, true);
                            return;
                        }
                        adapter.setState(id, true, true);
                    });
                });
                break;
            case 'resume':
                if (!state.val) {
                    adapter.setState(id, false, true);
                    adapter.log.warn('use pause or stop state if you want to pause or stop cleaning ' + robotName);
                    return;
                }
                updateRobot(allRobots[robotName], function (error) {
                    if (error) {
                        return;
                    }
                    if (allRobots[robotName].canResume !== true) {
                        adapter.log.warn('cannot resume cleaning ' + robotName);
                        adapter.setState(id, false, true);
                        return;
                    }
                    //resume cleaning
                    allRobots[robotName].resumeCleaning(function (error, result) {
                        if (error || result !== 'ok') {
                            adapter.log.warn('cannot resume cleaning (2) ' + robotName);
                            adapter.setState(id, false, true);
                            return;
                        }
                        adapter.setState(id, true, true);
                    });
                });
                break;
            case 'stop':
                if (!state.val) {
                    adapter.setState(id, false, true);
                    adapter.log.warn('use start or resume state if you want to start or resume cleaning ' + robotName);
                    return;
                }
                updateRobot(allRobots[robotName], function (error) {
                    if (error) {
                        return;
                    }
                    if (allRobots[robotName].canStop !== true) {
                        adapter.log.warn('cannot stop cleaning ' + robotName);
                        adapter.setState(id, false, true);
                        return;
                    }
                    //stop cleaning
                    allRobots[robotName].stopCleaning(function (error, result) {
                        if (error || result !== 'ok') {
                            adapter.log.warn('cannot stop cleaning (2) ' + robotName);
                            adapter.setState(id, false, true);
                            return;
                        }
                        adapter.setState(id, true, true);
                    });
                });
                break;
            case 'goToBase':
                if (!state.val) {
                    adapter.setState(id, false, true);
                    adapter.log.warn('use start state if you want to start cleaning ' + robotName);
                    return;
                }
                updateRobot(allRobots[robotName], function (error) {
                    if (error) {
                        return;
                    }
                    if (allRobots[robotName].canGoToBase !== true) {
                        adapter.log.warn('cannot go to base ' + robotName);
                        adapter.setState(id, false, true);
                        return;
                    }
                    //go to base
                    allRobots[robotName].sendToBase(function (error, result) {
                        if (error || result !== 'ok') {
                            adapter.log.warn('cannot go to base (2) ' + robotName);
                            adapter.setState(id, false, true);
                            return;
                        }
                        adapter.setState(id, true, true);
                    });
                });
                break;
            case 'eco':
                allRobots[robotName].eco = state.val;
                adapter.setState(id, state.val, true);
                break;
            case 'spotWidth':
                allRobots[robotName].spotWidth = state.val;
                adapter.setState(id, state.val, true);
                break;
            case 'spotHeight':
                allRobots[robotName].spotHeight = state.val;
                adapter.setState(id, state.val, true);
                break;
            case 'spotRepeat':
                allRobots[robotName].spotRepeat = state.val;
                adapter.setState(id, state.val, true);
                break;
            default:
                adapter.log.warn('unknown command: ' + command);
                return;
        }
    }
});

// is called when databases are connected and adapter received configuration.
// start here!
adapter.on('ready', function () {
    main();
});

function main() {
    var mail = adapter.config.mail;
    var password = adapter.config.password;

    client.authorize(mail, password, false, function (error) {
        if (error) {
            adapter.log.warn('login failed');
            setTimeout(main, 30000);
            return;
        }
        client.getRobots(function (error, robots) {
            if (error || !robots.length) {
                adapter.log.warn('no robots found');
                setTimeout(main, 30000);
            }
            var devices = {};
            for (var i = 0; i < robots.length; i++) {
                if (robots[i].name) {
                    devices[robots[i].name] = {
                        'status': {
                            common: 'meta',
                            states: {
                                'reachable': {
                                    common: {
                                        type: 'boolean',
                                        read: true,
                                        write: false,
                                        def: false,
                                        role: 'indicator.reachable'
                                    }
                                },
                                'lastResult': {
                                    common: {
                                        type: 'string',
                                        read: true,
                                        write: false,
                                        role: 'text'
                                    }
                                },
                                'error': {
                                    common: {
                                        type: 'string',
                                        read: true,
                                        write: false,
                                        role: 'text'
                                    }
                                },
                                'state': {
                                    common: {
                                        type: 'number',
                                        read: true,
                                        write: false,
                                        role: 'value'
                                    }
                                },
                                'action': {
                                    common: {
                                        type: 'number',
                                        read: true,
                                        write: false,
                                        role: 'value'
                                    }
                                },
                                'lastCleaning': {
                                    common: {
                                        type: 'string',
                                        read: true,
                                        write: false,
                                        role: 'text'
                                    }
                                },
                                'isCharging': {
                                    common: {
                                        type: 'boolean',
                                        read: true,
                                        write: false,
                                        role: 'indicator'
                                    }
                                },
                                'isScheduleEnabled': {
                                    common: {
                                        type: 'boolean',
                                        read: true,
                                        write: false,
                                        role: 'indicator'
                                    }
                                },
                                'isDocked': {
                                    common: {
                                        type: 'boolean',
                                        read: true,
                                        write: false,
                                        role: 'indicator'
                                    }
                                },
                                'dockHasBeenSeen': {
                                    common: {
                                        type: 'boolean',
                                        read: true,
                                        write: false,
                                        role: 'indicator'
                                    }
                                },
                                'charge': {
                                    common: {
                                        type: 'number',
                                        read: true,
                                        write: false,
                                        role: 'value.battery'
                                    }
                                },
                                'canStart': {
                                    common: {
                                        type: 'boolean',
                                        read: true,
                                        write: false,
                                        role: 'indicator'
                                    }
                                },
                                'canStop': {
                                    common: {
                                        type: 'boolean',
                                        read: true,
                                        write: false,
                                        role: 'indicator'
                                    }
                                },
                                'canPause': {
                                    common: {
                                        type: 'boolean',
                                        read: true,
                                        write: false,
                                        role: 'indicator'
                                    }
                                },
                                'canResume': {
                                    common: {
                                        type: 'boolean',
                                        read: true,
                                        write: false,
                                        role: 'indicator'
                                    }
                                },
                                'canGoToBase': {
                                    common: {
                                        type: 'boolean',
                                        read: true,
                                        write: false,
                                        role: 'indicator'
                                    }
                                },
                                'modelName': {
                                    common: {
                                        type: 'string',
                                        read: true,
                                        write: false,
                                        role: 'text'
                                    }
                                },
                                'firmware': {
                                    common: {
                                        type: 'string',
                                        read: true,
                                        write: false,
                                        role: 'text'
                                    }
                                }
                            }
                        },
                        'commands': {
                            common: 'button',
                            states: {
                                'schedule': {
                                    common: {
                                        type: 'boolean',
                                        read: true,
                                        write: true,
                                        def: false,
                                        role: 'switch'
                                    }
                                },
                                'clean': {
                                    common: {
                                        type: 'boolean',
                                        read: true,
                                        write: true,
                                        def: false,
                                        role: 'switch'
                                    }
                                },
                                'eco': {
                                    common: {
                                        type: 'boolean',
                                        read: true,
                                        write: true,
                                        def: false,
                                        role: 'switch'
                                    }
                                },
                                'cleanSpot': {
                                    common: {
                                        type: 'boolean',
                                        read: true,
                                        write: true,
                                        def: false,
                                        role: 'switch'
                                    }
                                },
                                'spotWidth': {
                                    common: {
                                        type: 'number',
                                        read: true,
                                        write: true,
                                        def: 100,
                                        min: 100,
                                        unit: 'cm',
                                        role: 'level.width'
                                    }
                                },
                                'spotHeight': {
                                    common: {
                                        type: 'number',
                                        read: true,
                                        write: true,
                                        def: 100,
                                        min: 100,
                                        unit: 'cm',
                                        role: 'level.height'
                                    }
                                },
                                'spotRepeat': {
                                    common: {
                                        type: 'boolean',
                                        read: true,
                                        write: true,
                                        def: false,
                                        role: 'switch'
                                    }
                                },
                                'pause': {
                                    common: {
                                        type: 'boolean',
                                        read: true,
                                        write: true,
                                        def: false,
                                        role: 'switch'
                                    }
                                },
                                'resume': {
                                    common: {
                                        type: 'boolean',
                                        read: true,
                                        write: true,
                                        def: false,
                                        role: 'switch'
                                    }
                                },
                                'stop': {
                                    common: {
                                        type: 'boolean',
                                        read: true,
                                        write: true,
                                        def: false,
                                        role: 'switch'
                                    }
                                },
                                'goToBase': {
                                    common: {
                                        type: 'boolean',
                                        read: true,
                                        write: true,
                                        def: false,
                                        role: 'switch'
                                    }
                                }
                            }
                        }
                    };
                    allRobots[robots[i].name] = robots[i];
                }
            }
            createDevices(devices, function () {
                adapter.log.info('devices created: ' + robots.length);
                adapter.getDevices(function (err, devices) {
                    if (Array.isArray(devices)) {
                        for (var i = 0; i < devices.length; i++) {
                            allRobotNames.push(devices[i].common.name);
                        }
                    }
                    //subscribe all states in namespace
                    adapter.subscribeStates('*');
                    update();
                });
            });
        });
    });
}


function update() {
    var pollInterval = adapter.config.pollInterval || 30000;
    client.getRobots(function (error, robots) {
        if (error || !robots.length) {
            adapter.log.warn('update error or no robot found ' + error);
            setTimeout(main, 30000);
            return;
        }
        for (var i = 0; i < allRobotNames.length; i++) {
            var k = null;
            //check if robot retrieved
            for (var j = 0; j < robots.length; j++) {
                if (robots[j].name === allRobotNames[i]) {
                    k = j;
                }
                if (allRobotNames.indexOf(robots[j].name) === -1) {
                    adapter.log.warn('new robot found');
                    setTimeout(main, 5000);
                    return;
                }
            }
            //robot not retrieved
            if (k === null) {
                adapter.setState(allRobotNames[i] + '.status.reachable', false, true);
                continue;
            }
            //update robot
            adapter.setState(allRobotNames[i] + '.status.reachable', true, true);
            updateRobot(robots[k]);
        }
        setTimeout(update, pollInterval);
    });
}


function updateRobot(robot, callback) {
    robot.getState(function (error, state) {
        if (error || !state) {
            adapter.log.warn('could not update robot ' + robot.name);
            setTimeout(main, 5000);
            if (typeof callback === 'function') {
                callback('could not update robot' + robot.name);
            }
            return;
        }
        adapter.setState(robot.name + '.status.lastResult', state.result, true);
        adapter.setState(robot.name + '.status.error', state.error, true);
        adapter.setState(robot.name + '.status.state', state.state, true);
        adapter.setState(robot.name + '.status.action', state.action, true);
        var lastCleaning = state.cleaning.category === 1 ? 'manual' : state.cleaning.category === 2 ? 'auto' : 'spot';
        lastCleaning += state.cleaning.mode === 1 ? ' eco' : ' turbo';
        lastCleaning += state.cleaning.modifier === 2 ? ' x2' : '';
        adapter.setState(robot.name + '.status.lastCleaning', lastCleaning, true);
        adapter.setState(robot.name + '.status.isCharging', state.details.isCharging, true);
        adapter.setState(robot.name + '.status.isDocked', state.details.isDocked, true);
        adapter.setState(robot.name + '.status.isScheduleEnabled', state.details.isScheduleEnabled, true);
        adapter.setState(robot.name + '.commands.schedule', state.details.isScheduleEnabled, true);
        adapter.setState(robot.name + '.status.dockHasBeenSeen', state.details.dockHasBeenSeen, true);
        adapter.setState(robot.name + '.status.charge', state.details.charge, true);
        adapter.setState(robot.name + '.status.canStart', state.availableCommands.start, true);
        adapter.setState(robot.name + '.status.canStop', state.availableCommands.stop, true);
        adapter.setState(robot.name + '.status.canPause', state.availableCommands.pause, true);
        adapter.setState(robot.name + '.status.canResume', state.availableCommands.resume, true);
        adapter.setState(robot.name + '.status.canGoToBase', state.availableCommands.goToBase, true);
        adapter.setState(robot.name + '.status.modelName', state.meta.modelName, true);
        adapter.setState(robot.name + '.status.firmware', state.meta.firmware, true);
        if (typeof callback === 'function') {
            callback(null);
        }
    });
}

function createDevices(devices, callback) {
    var keys = Object.keys(devices);
    if (!keys.length) return callback();
    var device = keys.shift();
    adapter.getObject(device, function (err, obj) {
        //next device if device exists
        if (obj) {
            delete devices[device];
            createDevices(devices, callback);
            return;
        }
        //create device
        adapter.createDevice(device, function () {
            //create channels for device
            createChannels(device, devices[device], function () {
                //next device
                delete devices[device];
                createDevices(devices, callback);
            });
        });
    });
}


function createChannels(device, channels, callback) {
    var keys = Object.keys(channels);
    if (!keys.length) return callback();
    var channel = keys.shift();
    adapter.createChannel(device, channel, channels[channel].common, function () {
        //create states
        createStates(
            device,
            channel,
            channels[channel].states,
            function () {
                //create next channel
                delete channels[channel];
                createChannels(device, channels, callback);
            }
        );
    });
}

function createStates(device, channel, states, callback) {
    var keys = Object.keys(states);
    if (!keys.length) return callback();
    var state = keys.shift();
    adapter.createState(device, channel, state, states[state].common, function () {
        //create next state
        delete states[state];
        createStates(device, channel, states, callback);
    });
}
