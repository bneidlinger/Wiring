export const config = {
    runner: 'local',
    
    specs: [
        './tests/cross-browser/**/*.test.js'
    ],
    
    exclude: [],
    
    maxInstances: 10,
    
    capabilities: [{
        // Chrome
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: ['--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage']
        }
    }, {
        // Firefox
        browserName: 'firefox',
        'moz:firefoxOptions': {
            args: ['-headless']
        }
    }, {
        // Safari (macOS only)
        browserName: 'safari',
        'safari:options': {}
    }, {
        // Edge
        browserName: 'MicrosoftEdge',
        'ms:edgeOptions': {
            args: ['--headless']
        }
    }],
    
    logLevel: 'info',
    bail: 0,
    baseUrl: 'http://localhost:5173',
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    
    services: ['chromedriver', 'geckodriver', 'edgedriver'],
    
    framework: 'mocha',
    reporters: ['spec', ['allure', {
        outputDir: 'tests/reports/allure-results',
        disableWebdriverStepsReporting: false,
        disableWebdriverScreenshotsReporting: false,
    }]],
    
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    },
    
    beforeSession: function (config, capabilities, specs) {
        console.log(`Starting ${capabilities.browserName} session`);
    },
    
    before: function (capabilities, specs) {
        browser.setWindowSize(1366, 768);
    },
    
    afterTest: async function(test, context, { error, result, duration, passed, retries }) {
        if (!passed) {
            await browser.takeScreenshot();
        }
    },
    
    after: function (result, capabilities, specs) {
        console.log(`Finished ${capabilities.browserName} tests`);
    }
};