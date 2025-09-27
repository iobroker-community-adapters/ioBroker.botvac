# ioBroker Adapter Development with GitHub Copilot

**Version:** 0.4.0
**Template Source:** https://github.com/DrozmotiX/ioBroker-Copilot-Instructions

This file contains instructions and best practices for GitHub Copilot when working on ioBroker adapter development.

## Project Context

You are working on an ioBroker adapter. ioBroker is an integration platform for the Internet of Things, focused on building smart home and industrial IoT solutions. Adapters are plugins that connect ioBroker to external systems, devices, or services.

### Adapter-Specific Context: Neato Botvac Integration
This is the **ioBroker.botvac** adapter that provides integration with Neato Botvac robotic vacuum cleaners. The adapter allows ioBroker to control and monitor Neato Botvac robots through their cloud API.

**Key Features:**
- **Robot Control**: Start/stop cleaning, pause, return to base
- **Cleaning Modes**: Normal and eco cleaning modes  
- **Spot Cleaning**: Clean specific areas with configurable width/height
- **Status Monitoring**: Battery level, dock status, cleaning state, error conditions
- **Command Validation**: Uses can* states to determine valid operations

**External Dependencies:**
- **node-botvac**: Third-party library for Neato Botvac API communication (uses forked version with schedule write support)
- **Neato Cloud API**: Requires user credentials for cloud-based robot communication
- **Robot Hardware**: Communicates with physical Neato Botvac vacuum cleaners

**Configuration Requirements:**
- User credentials (email/password) for Neato cloud service
- Configurable polling interval (minimum 60 seconds to respect API limits)
- Robot discovery and state synchronization

## Testing

### Unit Testing
- Use Jest as the primary testing framework for ioBroker adapters
- Create tests for all adapter main functions and helper methods
- Test error handling scenarios and edge cases
- Mock external API calls and hardware dependencies
- For adapters connecting to APIs/devices not reachable by internet, provide example data files to allow testing of functionality without live connections
- Example test structure:
  ```javascript
  describe('AdapterName', () => {
    let adapter;
    
    beforeEach(() => {
      // Setup test adapter instance
    });
    
    it('should handle API errors gracefully', async () => {
      // Test error scenarios
    });
  });
  ```

### Integration Testing
- Test actual communication with external systems where possible
- Use test environments or sandbox APIs when available
- Create comprehensive tests for data parsing and state management
- Test reconnection scenarios and error recovery

### Testing for Botvac Adapter
- **Mock Neato API Responses**: Create fixture data for different robot states, errors, and API responses
- **Test Command Validation**: Verify can* states correctly determine valid operations 
- **Test State Management**: Ensure robot status is properly mapped to ioBroker states
- **Test Error Scenarios**: Network failures, invalid credentials, unreachable robots
- **Test Polling Logic**: Verify appropriate API call intervals and backoff strategies

## Coding Standards

### General JavaScript/TypeScript Standards
- Use meaningful variable names (no single letters except for loops)
- Add JSDoc comments for all public functions
- Use async/await instead of Promise chains when possible
- Handle errors gracefully with proper logging
- Use strict mode (`'use strict';`)
- Follow ESLint rules configured for the project
- Use consistent indentation (4 spaces for ioBroker projects)

### ioBroker-Specific Standards
- Always use adapter logging methods: `this.log.error()`, `this.log.warn()`, `this.log.info()`, `this.log.debug()`
- Use appropriate log levels - avoid excessive logging at info level
- Always check if adapter is connected before API calls: `if (!this.connected) return;`
- Clean up resources in `unload()` method (timers, intervals, connections)
- Use `this.setState()` for updating object values
- Use `this.setObjectNotExists()` for creating objects
- Always provide proper object definitions with type, role, read/write flags
- Use meaningful state IDs following ioBroker naming conventions

### Botvac Adapter Code Patterns
- **State Management**: Use hierarchical object structure (commands.*, status.*, info.*)
- **Command States**: Set writable states to false after processing commands
- **API Error Handling**: Implement retry logic for transient failures, proper error state reporting
- **Polling Implementation**: Respect minimum 60-second intervals, implement exponential backoff on errors
- **Credential Validation**: Validate user credentials on startup, provide clear error messages

## State Management

### ioBroker Object Structure
- Create objects with proper metadata: name, type, role, min/max values
- Use appropriate data types: `boolean`, `number`, `string`
- Set `read`, `write` flags correctly
- Provide meaningful descriptions in multiple languages when possible
- Use proper roles: `switch.power`, `level.battery`, `text.status`, etc.

### State Synchronization
- Only update states when values actually change
- Use proper data types when setting states
- Always acknowledge state changes for command states
- Implement proper cleanup for unused objects

### Botvac State Structure
```javascript
// Command states (writable)
commands: {
  clean: boolean,        // Start cleaning
  stop: boolean,         // Stop cleaning  
  pause: boolean,        // Pause cleaning
  goToBase: boolean,     // Return to dock
  cleanSpot: boolean,    // Spot cleaning
  spotWidth: number,     // Spot width in cm
  spotHeight: number,    // Spot height in cm
  eco: boolean          // Eco mode toggle
}

// Status states (read-only)
status: {
  canStart: boolean,     // Can start cleaning
  canStop: boolean,      // Can stop cleaning
  canPause: boolean,     // Can pause cleaning
  canResume: boolean,    // Can resume cleaning
  canGoToBase: boolean,  // Can return to base
  dockHasBeenSeen: boolean, // Dock is known
  charge: number,        // Battery percentage
  state: string          // Current robot state
}
```

## Error Handling

### General Error Handling
- Always catch and handle exceptions
- Log errors with appropriate context
- Don't crash the adapter on recoverable errors
- Provide user-friendly error messages
- Implement reconnection logic for network issues

### API Error Handling
- Implement proper retry mechanisms with exponential backoff
- Handle rate limiting appropriately
- Parse API error responses and provide meaningful feedback
- Handle authentication errors gracefully
- Implement circuit breaker pattern for repeated failures

### Botvac-Specific Error Handling
- **Authentication Errors**: Clear error messages for invalid credentials, guide users to reconfigure
- **Robot Unreachable**: Mark robot as offline, implement recovery when robot comes back online
- **API Rate Limits**: Respect API limits, increase polling intervals when rate limited
- **Invalid Commands**: Check can* states before sending commands, provide user feedback for invalid operations

## Configuration Management

### ioBroker Configuration
- Define all configuration options in `io-package.json`
- Provide proper input validation
- Use appropriate input types: text, password, number, checkbox, select
- Provide helpful descriptions and default values
- Implement configuration change handling in adapter

### Credential Management
- Store sensitive data securely using adapter configuration encryption
- Never log credentials or sensitive information
- Validate credentials on adapter startup
- Provide clear feedback when authentication fails

### Botvac Configuration Requirements
```javascript
// Required configuration fields
config: {
  email: string,      // Neato account email (required)
  password: string,   // Neato account password (required, encrypted)
  pollInterval: number // Polling interval in seconds (min: 60, default: 120)
}
```

## API Integration Patterns

### HTTP Client Usage
- Use adapter's built-in request capabilities or well-established libraries
- Implement proper timeout handling
- Handle different HTTP status codes appropriately
- Add proper request/response logging for debugging
- Implement authentication handling

### External Library Integration
- Keep external dependencies minimal and well-maintained
- Handle library-specific errors appropriately
- Document any special requirements or limitations
- Use proper versioning to avoid breaking changes

### Neato Botvac API Integration
- **Library Usage**: Uses `node-botvac` library for API communication
- **Authentication**: Supports username/password authentication via Neato cloud
- **Rate Limiting**: Implement minimum 60-second polling intervals
- **Robot Discovery**: Handle multiple robots per account
- **Command Queue**: Ensure commands are processed in order, handle concurrent command conflicts

## Async Operations

### Promise Handling
- Use async/await syntax for better readability
- Always handle promise rejections
- Don't mix callback and promise patterns
- Use Promise.all() for parallel operations when safe
- Implement proper timeout handling for long-running operations

### Timer and Interval Management
- Store timer/interval references for cleanup
- Clear all timers in unload() method
- Use adapter.setTimeout() and adapter.setInterval() when available
- Handle timer errors gracefully

### Botvac Async Patterns
- **Polling Implementation**: Use setInterval for regular status updates, clear in unload()
- **Command Processing**: Use async/await for command execution, handle timeouts
- **API Calls**: Implement retry logic with exponential backoff for failed API calls

## Performance Considerations

### Memory Management
- Avoid memory leaks by properly cleaning up event listeners
- Don't store large amounts of data in memory unnecessarily
- Use streaming for large data operations
- Monitor adapter memory usage

### CPU Usage
- Avoid blocking the event loop with heavy computations
- Use appropriate polling intervals to balance responsiveness and resource usage
- Implement efficient data parsing and processing

### Network Usage
- Implement intelligent polling strategies
- Cache data when appropriate to reduce API calls
- Use compression when supported by external APIs
- Handle network errors gracefully

### Botvac Performance Optimization
- **Polling Strategy**: Only poll when necessary, increase intervals during extended idle periods
- **State Caching**: Cache robot state to avoid redundant API calls
- **Command Batching**: Group related commands when possible to reduce API usage

## Security Best Practices

### Credential Security
- Never log or expose user credentials
- Use secure storage for sensitive configuration data  
- Implement proper input validation and sanitization
- Handle authentication tokens securely

### Input Validation
- Validate all user inputs and configuration values
- Sanitize data before processing or storage
- Implement proper bounds checking for numeric values
- Handle edge cases and malformed data gracefully

### Network Security
- Use HTTPS for all external communications
- Validate SSL certificates
- Implement proper timeout and retry logic
- Avoid exposing internal network details in logs

## Debugging and Troubleshooting

### Logging Best Practices
- Use appropriate log levels (error, warn, info, debug)
- Include relevant context in log messages
- Don't log sensitive information
- Use structured logging when possible
- Provide actionable information in error messages

### Debug Information
- Include relevant state information in debug logs
- Log API requests/responses at debug level
- Provide clear error messages with resolution steps
- Include version information in logs when relevant

### Botvac Debugging Strategies
- **API Communication**: Log request/response details at debug level for troubleshooting
- **Robot State Changes**: Log significant state transitions for monitoring
- **Command Execution**: Track command success/failure with detailed context
- **Connection Issues**: Provide clear diagnostics for network and authentication problems

## Development Workflow

### Version Control
- Use meaningful commit messages following conventional commit format
- Create feature branches for new functionality
- Tag releases appropriately
- Maintain CHANGELOG.md with release notes

### Code Quality
- Run linting tools before committing
- Use automated testing in CI/CD pipeline
- Perform code reviews for all changes
- Monitor code coverage and maintain reasonable thresholds

### Release Management
- Follow semantic versioning (SemVer)
- Update io-package.json version and changelog
- Test thoroughly before releases
- Coordinate with ioBroker repository maintainers for updates

## Common Patterns and Examples

### Adapter Initialization
```javascript
class BotVac extends utils.Adapter {
    constructor(options) {
        super({
            ...options,
            name: 'botvac',
        });
        this.on('ready', this.onReady.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    async onReady() {
        // Validate configuration
        if (!this.config.email || !this.config.password) {
            this.log.error('Missing credentials in configuration');
            return;
        }
        
        // Initialize API client
        await this.initializeClient();
        
        // Start polling
        this.startPolling();
    }
}
```

### State Creation Pattern
```javascript
async createStates() {
    // Command states (writable)
    await this.setObjectNotExists('commands.clean', {
        type: 'state',
        common: {
            name: 'Start cleaning',
            type: 'boolean',
            role: 'button.start',
            read: true,
            write: true,
            def: false
        },
        native: {}
    });
    
    // Status states (read-only)
    await this.setObjectNotExists('status.canStart', {
        type: 'state',
        common: {
            name: 'Can start cleaning',
            type: 'boolean',
            role: 'indicator',
            read: true,
            write: false,
            def: false
        },
        native: {}
    });
}
```

### Command Processing Pattern
```javascript
async onStateChange(id, state) {
    if (!state || state.ack) return;
    
    const command = id.split('.').pop();
    
    try {
        switch (command) {
            case 'clean':
                if (state.val && await this.canStart()) {
                    await this.startCleaning();
                    await this.setState(id, false, true);
                }
                break;
                
            case 'stop':
                if (state.val && await this.canStop()) {
                    await this.stopCleaning();
                    await this.setState(id, false, true);
                }
                break;
        }
    } catch (error) {
        this.log.error(`Command ${command} failed: ${error.message}`);
        await this.setState(id, false, true);
    }
}
```

## Troubleshooting Guide

### Common Issues
1. **Adapter won't start**: Check configuration, credentials, and log files
2. **States not updating**: Verify polling is working and API connectivity
3. **Commands not working**: Check can* states and robot availability
4. **High CPU usage**: Review polling intervals and async operation handling

### Botvac-Specific Issues
1. **Robot not found**: Check Neato account access and robot registration
2. **Commands ignored**: Verify robot is in a state that allows the command
3. **Frequent disconnections**: Check network stability and API rate limiting
4. **Authentication failures**: Verify credentials and account status

---

This comprehensive guide should help GitHub Copilot understand the context and patterns specific to ioBroker adapter development, particularly for the Neato Botvac integration.