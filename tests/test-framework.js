/**
 * Simple Test Framework for Sawyer's RPG Game
 * Provides basic testing utilities using vanilla JavaScript
 */

class SimpleTestFramework {
    constructor() {
        this.tests = [];
        this.suites = {};
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0
        };

        // Set global flag to indicate tests are running
        window.TEST_FRAMEWORK_RUNNING = true;
        this.currentSuite = null;
        this.verbose = false;
    }
    
    /**
     * Create a test suite
     */
    describe(suiteName, suiteFunction) {
        this.currentSuite = suiteName;
        this.suites[suiteName] = {
            name: suiteName,
            tests: [],
            beforeEach: null,
            afterEach: null,
            beforeAll: null,
            afterAll: null
        };
        
        // Execute suite function to register tests
        suiteFunction();
        this.currentSuite = null;
    }
    
    /**
     * Define a test case
     */
    it(testName, testFunction, options = {}) {
        const test = {
            name: testName,
            function: testFunction,
            suite: this.currentSuite,
            skip: options.skip || false,
            timeout: options.timeout || 5000,
            async: options.async || false
        };
        
        if (this.currentSuite) {
            this.suites[this.currentSuite].tests.push(test);
        } else {
            this.tests.push(test);
        }
    }
    
    /**
     * Skip a test
     */
    xit(testName, testFunction) {
        this.it(testName, testFunction, { skip: true });
    }
    
    /**
     * Setup functions
     */
    beforeEach(setupFunction) {
        if (this.currentSuite) {
            this.suites[this.currentSuite].beforeEach = setupFunction;
        }
    }
    
    afterEach(teardownFunction) {
        if (this.currentSuite) {
            this.suites[this.currentSuite].afterEach = teardownFunction;
        }
    }
    
    beforeAll(setupFunction) {
        if (this.currentSuite) {
            this.suites[this.currentSuite].beforeAll = setupFunction;
        }
    }
    
    afterAll(teardownFunction) {
        if (this.currentSuite) {
            this.suites[this.currentSuite].afterAll = teardownFunction;
        }
    }
    
    /**
     * Run all tests
     */
    async runTests() {
        console.log('🚀 Starting test run...\n');
        this.results = { total: 0, passed: 0, failed: 0, skipped: 0 };
        
        // Run standalone tests
        for (const test of this.tests) {
            await this.runSingleTest(test);
        }
        
        // Run test suites
        for (const [suiteName, suite] of Object.entries(this.suites)) {
            await this.runTestSuite(suite);
        }
        
        this.printResults();
        return this.results;
    }
    
    /**
     * Run a test suite
     */
    async runTestSuite(suite) {
        console.log(`📂 ${suite.name}`);
        
        // Run beforeAll
        if (suite.beforeAll) {
            try {
                await suite.beforeAll();
            } catch (error) {
                console.error(`❌ beforeAll failed in ${suite.name}:`, error);
                return;
            }
        }
        
        // Run each test
        for (const test of suite.tests) {
            // Run beforeEach
            if (suite.beforeEach) {
                try {
                    await suite.beforeEach();
                } catch (error) {
                    console.error(`❌ beforeEach failed for ${test.name}:`, error);
                    continue;
                }
            }
            
            await this.runSingleTest(test, '  ');
            
            // Run afterEach
            if (suite.afterEach) {
                try {
                    await suite.afterEach();
                } catch (error) {
                    console.error(`❌ afterEach failed for ${test.name}:`, error);
                }
            }
        }
        
        // Run afterAll
        if (suite.afterAll) {
            try {
                await suite.afterAll();
            } catch (error) {
                console.error(`❌ afterAll failed in ${suite.name}:`, error);
            }
        }
        
        console.log(''); // Empty line after suite
    }
    
    /**
     * Run a single test
     */
    async runSingleTest(test, indent = '') {
        this.results.total++;
        
        if (test.skip) {
            this.results.skipped++;
            console.log(`${indent}⏭️  ${test.name} (skipped)`);
            return;
        }
        
        try {
            const startTime = performance.now();
            
            if (test.async) {
                // Handle async test with timeout
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Test timeout')), test.timeout);
                });
                
                await Promise.race([test.function(), timeoutPromise]);
            } else {
                test.function();
            }
            
            const endTime = performance.now();
            const duration = Math.round(endTime - startTime);
            
            this.results.passed++;
            console.log(`${indent}✅ ${test.name} (${duration}ms)`);
            
        } catch (error) {
            this.results.failed++;
            console.log(`${indent}❌ ${test.name}`);
            
            if (this.verbose || error.name === 'AssertionError') {
                console.log(`${indent}   ${error.message}`);
                if (error.stack && this.verbose) {
                    console.log(`${indent}   ${error.stack}`);
                }
            }
        }
    }
    
    /**
     * Print final results
     */
    printResults() {
        console.log('📊 Test Results:');
        console.log(`   Total: ${this.results.total}`);
        console.log(`   ✅ Passed: ${this.results.passed}`);
        console.log(`   ❌ Failed: ${this.results.failed}`);
        console.log(`   ⏭️  Skipped: ${this.results.skipped}`);
        
        const passRate = this.results.total > 0 ? 
            Math.round((this.results.passed / this.results.total) * 100) : 0;
        console.log(`   📈 Pass Rate: ${passRate}%`);
        
        if (this.results.failed === 0) {
            console.log('\n🎉 All tests passed!');
        } else {
            console.log(`\n💥 ${this.results.failed} test(s) failed`);
        }
    }
    
    /**
     * Enable verbose output
     */
    setVerbose(verbose = true) {
        this.verbose = verbose;
    }
}

/**
 * Assertion utilities
 */
class Assert {
    static equal(actual, expected, message = '') {
        if (actual !== expected) {
            throw new AssertionError(
                message || `Expected ${expected}, but got ${actual}`,
                actual,
                expected
            );
        }
    }
    
    static notEqual(actual, expected, message = '') {
        if (actual === expected) {
            throw new AssertionError(
                message || `Expected ${actual} to not equal ${expected}`,
                actual,
                expected
            );
        }
    }
    
    static deepEqual(actual, expected, message = '') {
        if (!this.deepCompare(actual, expected)) {
            throw new AssertionError(
                message || `Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`,
                actual,
                expected
            );
        }
    }
    
    static truthy(value, message = '') {
        if (!value) {
            throw new AssertionError(
                message || `Expected truthy value, but got ${value}`,
                value,
                true
            );
        }
    }
    
    static falsy(value, message = '') {
        if (value) {
            throw new AssertionError(
                message || `Expected falsy value, but got ${value}`,
                value,
                false
            );
        }
    }
    
    static throws(fn, expectedError, message = '') {
        let threw = false;
        let actualError = null;
        
        try {
            fn();
        } catch (error) {
            threw = true;
            actualError = error;
        }
        
        if (!threw) {
            throw new AssertionError(
                message || 'Expected function to throw an error',
                'no error',
                'error thrown'
            );
        }
        
        if (expectedError && !(actualError instanceof expectedError)) {
            throw new AssertionError(
                message || `Expected error of type ${expectedError.name}, but got ${actualError.constructor.name}`,
                actualError,
                expectedError
            );
        }
    }
    
    static async doesNotThrow(fn, message = '') {
        try {
            await fn();
        } catch (error) {
            throw new AssertionError(
                message || `Expected function not to throw, but got: ${error.message}`,
                error,
                'no error'
            );
        }
    }
    
    static arrayContains(array, item, message = '') {
        if (!Array.isArray(array) || !array.includes(item)) {
            throw new AssertionError(
                message || `Expected array to contain ${item}`,
                array,
                `array containing ${item}`
            );
        }
    }
    
    static arrayLength(array, expectedLength, message = '') {
        if (!Array.isArray(array) || array.length !== expectedLength) {
            throw new AssertionError(
                message || `Expected array length ${expectedLength}, but got ${array ? array.length : 'not an array'}`,
                array ? array.length : array,
                expectedLength
            );
        }
    }
    
    static objectHasProperty(object, property, message = '') {
        if (!object || typeof object !== 'object' || !(property in object)) {
            throw new AssertionError(
                message || `Expected object to have property '${property}'`,
                object,
                `object with property '${property}'`
            );
        }
    }
    
    /**
     * Deep comparison utility
     */
    static deepCompare(a, b) {
        if (a === b) return true;
        
        if (a == null || b == null) return false;
        
        if (Array.isArray(a) && Array.isArray(b)) {
            if (a.length !== b.length) return false;
            for (let i = 0; i < a.length; i++) {
                if (!this.deepCompare(a[i], b[i])) return false;
            }
            return true;
        }
        
        if (typeof a === 'object' && typeof b === 'object') {
            const keysA = Object.keys(a);
            const keysB = Object.keys(b);
            
            if (keysA.length !== keysB.length) return false;
            
            for (const key of keysA) {
                if (!keysB.includes(key)) return false;
                if (!this.deepCompare(a[key], b[key])) return false;
            }
            return true;
        }
        
        return false;
    }
}

/**
 * Custom assertion error
 */
class AssertionError extends Error {
    constructor(message, actual, expected) {
        super(message);
        this.name = 'AssertionError';
        this.actual = actual;
        this.expected = expected;
    }
}

// Create global test framework instance
const testFramework = new SimpleTestFramework();

// Export globals for easy testing
window.describe = (name, fn) => testFramework.describe(name, fn);
window.it = (name, fn, options) => testFramework.it(name, fn, options);
window.xit = (name, fn) => testFramework.xit(name, fn);
window.beforeEach = (fn) => testFramework.beforeEach(fn);
window.afterEach = (fn) => testFramework.afterEach(fn);
window.beforeAll = (fn) => testFramework.beforeAll(fn);
window.afterAll = (fn) => testFramework.afterAll(fn);
window.runTests = () => testFramework.runTests();
window.setVerbose = (verbose) => testFramework.setVerbose(verbose);

// Export assertion functions
window.assertEqual = Assert.equal;
window.assertNotEqual = Assert.notEqual;
window.assertDeepEqual = Assert.deepEqual;
window.assertTruthy = Assert.truthy;
window.assertFalsy = Assert.falsy;
window.assertThrows = Assert.throws;
window.assertDoesNotThrow = Assert.doesNotThrow;
window.assertArrayContains = Assert.arrayContains;
window.assertArrayLength = Assert.arrayLength;
window.assertObjectHasProperty = Assert.objectHasProperty;

// Also make Assert class available
window.Assert = Assert;
window.TestFramework = testFramework;

console.log('✅ Test Framework loaded');
console.log('Use describe(), it(), and assert functions to write tests');
console.log('Run tests with runTests()');
console.log('Enable verbose output with setVerbose(true)');