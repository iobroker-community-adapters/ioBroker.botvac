/**
 *
 * botvac adapter
 *
 */

/* jshint -W097 */// jshint strict:false
/*jslint node: true */
"use strict";

var utils = require('@iobroker/adapter-core'); // Get common adapter utils
var botvac =    require('node-botvac');
var client =    new botvac.Client();
var allRobotNames = [];
var allRobots = {};
var init = false;
var polltimer;
var pollInterval;
var restartTimer;

// adapter will be restarted automatically every time as the configuration changed, e.g system.adapter.botvac.0
var adapter = utils.adapter('botvac');

// is called when adapter shuts down - callback has to be called under any circumstances!
adapter.on('unload', function (callback) {
    callback();
});

// is called if a subscribed state changes
adapter.on('stateChange', function (id, state) {
    // you can use the ack flag to detect if it is status (true) or command (false)
    if (init && state && !state.ack) {
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
                        adapter.setState(robotName + '.status.isScheduleEnabled', true, true);
                    });
                } else {
                    allRobots[robotName].disableSchedule(function (error, result) {
                        if (error || result !== 'ok') {
                            adapter.log.warn('cannot disable schedule ' + robotName);
                            adapter.setState(id, true, true);
                            return;
                        }
                        adapter.setState(id, false, true);
                        adapter.setState(robotName + '.status.isScheduleEnabled', false, true);
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
                        setTimeout(function () {
                            updateRobot(allRobots[robotName]);
                        }, 1000);
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
                        setTimeout(function () {
                            updateRobot(allRobots[robotName]);
                        }, 1000);
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
                        setTimeout(function () {
                            updateRobot(allRobots[robotName]);
                        }, 1000);
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
                        setTimeout(function () {
                            updateRobot(allRobots[robotName]);
                        }, 1000);
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
                        setTimeout(function () {
                            updateRobot(allRobots[robotName]);
                        }, 1000);
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
                        setTimeout(function () {
                            updateRobot(allRobots[robotName]);
                        }, 1000);
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

function restart(ms) {
    clearTimeout(restartTimer);
    clearInterval(polltimer);
    init = false;
    restartTimer = setTimeout(main, ms);
}

function main() {
    clearInterval(polltimer);
    allRobotNames = [];
    allRobots = {};
    var mail = adapter.config.mail;
    var password = adapter.config.password;

    client.authorize(mail, password, false, function (error) {
        if (error) {
            adapter.log.warn('login failed');
            restart(300000);
            return;
        }
        client.getRobots(function (error, robots) {
            if (error || !robots.length) {
                adapter.log.warn('no robots found');
                restart(300000);
                return;
            }
            prepareRobotsStructure(robots, {}, function(error, devices) {
                if (error) {
                    adapter.log.warn('can not prepare device! Err = ' +JSON.stringify(error));
                    restart(300000);
                    return;
                }
                adapter.log.info('devices found: ' + Object.keys(devices).length);
                createRobotsObjects(devices, null, null, function (error, result) {
                    if (error) {
                        adapter.log.warn('can not create appropriate objects! Err = ' + JSON.stringify(error));
                        restart(300000);
                        return;
                    }
                    adapter.getDevices(function (err, devices) {
                        if (Array.isArray(devices)) {
                            for (var i = 0; i < devices.length; i++) {
                                allRobotNames.push(devices[i].common.name);
                            }
                        }
                        //subscribe all states in namespace
                        init = true;
                        adapter.subscribeStates('*');
                        pollInterval = adapter.config.pollInterval || 120;
                        pollInterval *= 1000;
                        if (pollInterval < 60000) pollInterval = 60000;
                        polltimer = setInterval(update, pollInterval);
                        update();
                    });
                });
            });
        });
    });
}


function update() {
    for (var i = 0; i < allRobotNames.length; i++) {
        updateRobot(allRobots[allRobotNames[i]]);
    }


/*
    client.getRobots(function (error, robots) {
        adapter.log.warn('getRobots!');
        if (error || !robots.length) {
            adapter.log.warn('update error or no robot found ' + error);
            restart(300000);
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
                    restart(5000);
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
    });
*/
}


function updateRobot(robot, callback) {
    if (!init) {
        return;
    }
    robot.getState(function (error, state) {
        if (error || !state) {
            adapter.log.warn('could not update robot ' + robot.name);
            adapter.setState(robot.name + '.status.reachable', true, false);
            restart(pollInterval);
            if (typeof callback === 'function') {
                callback('could not update robot' + robot.name);
            }
            return;
        }
        adapter.setState(robot.name + '.status.reachable', true, true);
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
        if (state.availableCommands.start) {
            adapter.setState(robot.name + '.commands.clean', false, true);
            adapter.setState(robot.name + '.commands.cleanSpot', false, true);
        }
        adapter.setState(robot.name + '.status.canStop', state.availableCommands.stop, true);
        if (state.availableCommands.stop) {
            adapter.setState(robot.name + '.commands.stop', false, true);
        }
        adapter.setState(robot.name + '.status.canPause', state.availableCommands.pause, true);
        if (state.availableCommands.pause) {
            adapter.setState(robot.name + '.commands.pause', false, true);
        }
        adapter.setState(robot.name + '.status.canResume', state.availableCommands.resume, true);
        if (state.availableCommands.resume) {
            adapter.setState(robot.name + '.commands.resume', false, true);
        }
        adapter.setState(robot.name + '.status.canGoToBase', state.availableCommands.goToBase, true);
        if (state.availableCommands.goToBase) {
            adapter.setState(robot.name + '.commands.goToBase', false, true);
        }
        adapter.setState(robot.name + '.status.modelName', state.meta.modelName, true);
        adapter.setState(robot.name + '.status.firmware', state.meta.firmware, true);
        if (typeof callback === 'function') {
            callback(null);
        }
    });
}


const statusROStringText = { common: { type: 'string', read: true, write: false, role: 'text' } };
const statusRONumberValue = { common: { type: 'number', read: true, write: false, role: 'value' } };
const statusROBooleanIndicator = { common: { type: 'boolean', read: true, write: false, role: 'indicator' } }
const commandRWBooleanSwitch = { common: { type: 'boolean', read: true, write: true, def: false, role: 'switch' } };

function prepareRobotsStructure(robots, devices, callback) {
    if (!robots.length) return (typeof callback === 'function') ? callback(null, devices) : null;
    var robot = robots.shift();
    if (robot.name) {
        robot.getState(function (error, state) {
            if (error || !state) {
                adapter.log.warn('could not update robot ' + robot.name);
            }
            else {
                devices[robot.name] = {
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
                            'lastResult': statusROStringText ,
                            'error': statusROStringText,
                            'state': statusRONumberValue,
                            'action': statusRONumberValue,
                            'lastCleaning': statusROStringText,
                            'isCharging': statusROBooleanIndicator ,
                            'isScheduleEnabled': statusROBooleanIndicator,
                            'isDocked': statusROBooleanIndicator,
                            'dockHasBeenSeen': statusROBooleanIndicator,
                            'charge': {
                                common: {
                                    type: 'number',
                                    read: true,
                                    write: false,
                                    role: 'value.battery'
                                }
                            },
                            'canStart': statusROBooleanIndicator,
                            'canStop': statusROBooleanIndicator,
                            'canPause': statusROBooleanIndicator,
                            'canResume': statusROBooleanIndicator,
                            'canGoToBase': statusROBooleanIndicator,
                            'modelName': statusROStringText,
                            'firmware': statusROStringText
                        }
                    },
                    'commands': {
                        common: 'button',
                        states: {
                            'schedule': commandRWBooleanSwitch,
                            'clean': commandRWBooleanSwitch,
                            'eco': commandRWBooleanSwitch,
                            'cleanSpot': commandRWBooleanSwitch,
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
                            'spotRepeat': commandRWBooleanSwitch,
                            'pause': commandRWBooleanSwitch,
                            'resume': commandRWBooleanSwitch,
                            'stop': commandRWBooleanSwitch,
                            'goToBase': commandRWBooleanSwitch,
                        }
                    }
                };
                allRobots[robot.name] = robot;
            }
            prepareRobotsStructure(robots, devices, callback)
        });
    }
}


function createRobotsObjects(devices, channels, states, callback) {
    if (states !== null) {
        let keys = Object.keys(states);
        if (keys.length) {
            let state = keys.shift();
            let device = Object.keys(devices)[0];
            let channel = Object.keys(channels)[0];
            adapter.setObjectNotExists( device + '.' + channel + '.' + state, {type: 'state', common: Object.assign(states[state].common, {name: state})}, function (error, result) {
                if (error === null) {
                    if ( (result !== undefined) && (states[state].common.def !== undefined) ) {
                        //get rid of quality equal 0x20
                        adapter.setState(device + '.' + channel + '.' + state, states[state].common.def, true);
                    }
                    // state exists or created, can process next
                    delete states[state];
                    // check, if we have more states under current channel
                    keys = Object.keys(states);
                    if (keys.length) {
                        // we have more states under current channel, lets proceed
                        createRobotsObjects(devices, channels, states, callback)
                    }
                    else {
                        // all states under current channel were created, can process next channel
                        delete channels[channel];
                        // check, if we have more channels under current device
                        keys = Object.keys(channels);
                        if (keys.length) {
                            // we have more channels under current device, lets proceed
                            createRobotsObjects(devices, channels, null, callback);
                        }
                        else {
                            // all channels under current device were created, can process next device
                            delete devices[device];
                            // check, if we have more devices
                            keys = Object.keys(devices);
                            if (keys.length) {
                                // we have more devices, lets proceed
                                createRobotsObjects(devices, null, null, callback);
                            }
                            else {
                                // all device were processed, lets return result
                                if (typeof callback === 'function') {
                                    callback(null, true);
                                }
                                else {
                                    adapter.log.warn('createRobotsObjects(): callback not a function: ' + JSON.stringify(callback));
                                }
                            }
                        }
                    }
                }
            });
        }
    }
    else if (channels !== null) {
        let keys = Object.keys(channels);
        if (keys.length) {
            let channel = keys.shift();
            let device = Object.keys(devices)[0];
            adapter.setObjectNotExists( device + '.' + channel , {type: 'channel', common: Object.assign(channels[channel].common, {name: channel})}, function (error, result) {
                if (error === null) {
                    if ((result === undefined) || (result === null)) {
                        //channel was exists before, let's check for unsupported states
                        let statesActual = Object.keys(channels[channel].states);
                        adapter.getStatesOf(device, channel, function (error, objects) {
                            if (objects && !error) {
                                //validate every exsiting state vs supported(Actual)
                                objects.forEach(function (object) {
                                    let state = object['common']['name'];
                                    if (statesActual.indexOf(state) < 0) {
                                        //state is not supported(Actual)
                                        adapter.log.warn('Delete state: ' + JSON.stringify(state) + ' with id: ' + object['_id'].split('.').pop());
                                        //delete obsolete state
                                        adapter.deleteState(device, channel, object['_id'].split('.').pop());
                                    }
                                });
                            }
                        });
                    }
                    //can initiate create states under channel
                    createRobotsObjects(devices, channels, channels[channel].states, callback);
                }
            });
        }
        else {
            //by code we have no face with such issue, but ...
            if (typeof callback === 'function') {
                callback('something wrong with channels : ' + JSON.stringify(channels) + ' for device: ' + JSON.stringify(Object.keys(devices)[0]), false);
            }
            else {
                adapter.log.warn('createRobotsObjects(): callback not a function: ' + JSON.stringify(callback));
            }
        }
    }
    else {
        let keys = Object.keys(devices);
        //let's check for non-valid(not exits in a cloud) devices
        let devicesActual = Object.keys(devices);
        adapter.getDevices(function (error, objects) {
            if (objects && !error) {
                //validate every exsiting device
                objects.forEach(function (object) {
                    let device = object['common']['name'];
                    if (devicesActual.indexOf(device) < 0) {
                        //device is not exits in a cloud
                        adapter.log.warn('Device' + JSON.stringify(device) + ' with id: ' + object['_id'].split('.').pop() + ' is not exists in cloud any more!');
                        //delete obsolete state, disabled
                        //adapter.deleteDevice(device);
                    }
                });
            }
        });
        if (keys.length) {
            let device = keys.shift();
            adapter.setObjectNotExists( device , {type: 'device', common: {name: device}}, function (error, result) {
                if (error === null) {
                    if ((result === undefined) || (result === null)) {
                        //device was exists before, let's check for unsupported channels
                        let channelsActual = Object.keys(devices[device]);
                        adapter.getChannels(device, function (error, objects) {
                            if (objects && !error) {
                                //validate every exsiting channel
                                objects.forEach(function (object) {
                                    let channel = object['common']['name'];
                                    if (channelsActual.indexOf(channel) < 0) {
                                        //channel is not supported (Actual)
                                        adapter.log.warn('Delete channel: ' + JSON.stringify(channel) + ' with id: ' + object['_id'].split('.').pop());
                                        //delete obsolete channel
                                        adapter.deleteChannel(device, object['_id'].split('.').pop());
                                    }
                                });
                            }
                        });
                    }
                    createRobotsObjects(devices, devices[device], null, callback);
                }
            });
        }
        else {
            if (typeof callback === 'function') {
                callback('something wrong with devices: ' + JSON.stringify(devices), false);
            }
            else {
                adapter.log.warn('createRobotsObjects(): callback not a function: ' + JSON.stringify(callback));
            }
        }
    }
}


