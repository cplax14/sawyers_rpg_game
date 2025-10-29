/**
 * Animation Performance Test Component
 *
 * Task 7.8: Performance test - cast all spells in sequence and verify 60fps
 *
 * Tests all spell animations with both normal and critical hits
 * Measures FPS, frame drops, and animation performance
 * Generates comprehensive performance report
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimationController } from './AnimationController';

// ================================================================
// FPS MEASUREMENT UTILITIES
// ================================================================

interface FPSMeasurement {
  average: number;
  min: number;
  max: number;
  frameDrops: number; // Count of frames below 55 FPS
  samples: number[];
}

interface AnimationTestResult {
  spellName: string;
  isCritical: boolean;
  duration: number;
  fps: FPSMeasurement;
  timestamp: number;
}

interface PerformanceReport {
  testStartTime: number;
  testEndTime: number;
  totalDuration: number;
  results: AnimationTestResult[];
  overallFPS: FPSMeasurement;
  passed: boolean;
  failureReasons: string[];
}

/**
 * FPS Monitor using requestAnimationFrame
 * Tracks frame times and calculates FPS
 */
class FPSMonitor {
  private frameTimes: number[] = [];
  private lastFrameTime: number = 0;
  private isRunning: boolean = false;
  private rafId: number | null = null;

  start(): void {
    this.frameTimes = [];
    this.lastFrameTime = performance.now();
    this.isRunning = true;
    this.measureFrame();
  }

  stop(): void {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private measureFrame = (): void => {
    if (!this.isRunning) return;

    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;

    if (deltaTime > 0) {
      const fps = 1000 / deltaTime;
      this.frameTimes.push(fps);
    }

    this.lastFrameTime = now;
    this.rafId = requestAnimationFrame(this.measureFrame);
  };

  getMeasurement(): FPSMeasurement {
    if (this.frameTimes.length === 0) {
      return {
        average: 0,
        min: 0,
        max: 0,
        frameDrops: 0,
        samples: [],
      };
    }

    const samples = [...this.frameTimes];
    const average = samples.reduce((a, b) => a + b, 0) / samples.length;
    const min = Math.min(...samples);
    const max = Math.max(...samples);
    const frameDrops = samples.filter(fps => fps < 55).length;

    return {
      average,
      min,
      max,
      frameDrops,
      samples,
    };
  }

  reset(): void {
    this.frameTimes = [];
  }
}

// ================================================================
// TEST SPELL CONFIGURATIONS
// ================================================================

interface TestSpell {
  id: string;
  name: string;
  attackType: string;
  element: string;
  damage: number;
}

const TEST_SPELLS: TestSpell[] = [
  {
    id: 'magic_bolt',
    name: 'Magic Bolt',
    attackType: 'magic_bolt',
    element: 'arcane',
    damage: 25,
  },
  {
    id: 'fireball',
    name: 'Fireball',
    attackType: 'fireball',
    element: 'fire',
    damage: 35,
  },
  {
    id: 'ice_shard',
    name: 'Ice Shard',
    attackType: 'ice_shard',
    element: 'ice',
    damage: 30,
  },
  {
    id: 'lightning',
    name: 'Lightning',
    attackType: 'lightning',
    element: 'lightning',
    damage: 40,
  },
  {
    id: 'holy_beam',
    name: 'Holy Beam',
    attackType: 'holy_beam',
    element: 'holy',
    damage: 38,
  },
  {
    id: 'meteor',
    name: 'Meteor',
    attackType: 'meteor',
    element: 'fire',
    damage: 50,
  },
];

// ================================================================
// PERFORMANCE TEST COMPONENT
// ================================================================

export const AnimationPerformanceTest: React.FC = () => {
  // Test state
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<{
    spell: TestSpell;
    isCritical: boolean;
    index: number;
  } | null>(null);
  const [results, setResults] = useState<AnimationTestResult[]>([]);
  const [testComplete, setTestComplete] = useState(false);
  const [report, setReport] = useState<PerformanceReport | null>(null);

  // Test configuration
  const [testMode, setTestMode] = useState<'sequential' | 'stress'>('sequential');
  const [includeCriticals, setIncludeCriticals] = useState(true);

  // FPS monitoring
  const fpsMonitor = useRef(new FPSMonitor());
  const testStartTime = useRef<number>(0);
  const currentAnimationStart = useRef<number>(0);

  // Animation state
  const [activeAnimation, setActiveAnimation] = useState<{
    attackType: string;
    attackData: any;
    isActive: boolean;
  } | null>(null);

  // Test queue
  const testQueue = useRef<Array<{ spell: TestSpell; isCritical: boolean; index: number }>>([]);

  // ================================================================
  // TEST EXECUTION LOGIC
  // ================================================================

  /**
   * Build the test queue based on configuration
   */
  const buildTestQueue = useCallback(() => {
    const queue: Array<{ spell: TestSpell; isCritical: boolean; index: number }> = [];

    TEST_SPELLS.forEach((spell, spellIndex) => {
      // Normal hit
      queue.push({
        spell,
        isCritical: false,
        index: spellIndex * 2,
      });

      // Critical hit
      if (includeCriticals) {
        queue.push({
          spell,
          isCritical: true,
          index: spellIndex * 2 + 1,
        });
      }
    });

    return queue;
  }, [includeCriticals]);

  /**
   * Start the performance test
   */
  const startTest = useCallback(() => {
    console.log('🧪 [Performance Test] Starting animation performance test...');
    console.log(`📊 Test Configuration: ${testMode}, Include Criticals: ${includeCriticals}`);

    // Reset state
    setResults([]);
    setTestComplete(false);
    setReport(null);

    // Build test queue
    const queue = buildTestQueue();
    testQueue.current = queue;

    console.log(`📝 [Performance Test] ${queue.length} animations in queue`);

    // Start FPS monitoring
    fpsMonitor.current.start();
    testStartTime.current = performance.now();

    // Start test
    setIsRunning(true);

    // Trigger first animation
    if (queue.length > 0) {
      const firstTest = queue[0];
      setCurrentTest(firstTest);
      triggerAnimation(firstTest.spell, firstTest.isCritical);
    }
  }, [testMode, includeCriticals, buildTestQueue]);

  /**
   * Trigger an animation with test data
   */
  const triggerAnimation = (spell: TestSpell, isCritical: boolean) => {
    console.log(
      `🎬 [Performance Test] Casting ${spell.name} (${isCritical ? 'CRITICAL' : 'normal'})`
    );

    // Record animation start time
    currentAnimationStart.current = performance.now();

    // Reset FPS monitor for this animation
    fpsMonitor.current.reset();
    fpsMonitor.current.start();

    // Fixed positions for testing (center screen)
    const casterX = 200;
    const casterY = 300;
    const targetX = 600;
    const targetY = 300;

    setActiveAnimation({
      attackType: spell.attackType,
      attackData: {
        casterX,
        casterY,
        targetX,
        targetY,
        damage: spell.damage,
        isCritical,
        element: spell.element,
      },
      isActive: true,
    });
  };

  /**
   * Handle animation completion
   */
  const handleAnimationComplete = useCallback(() => {
    if (!currentTest) return;

    const animationEnd = performance.now();
    const duration = animationEnd - currentAnimationStart.current;

    // Get FPS measurement for this animation
    const fpsMeasurement = fpsMonitor.current.getMeasurement();

    // Record result
    const result: AnimationTestResult = {
      spellName: currentTest.spell.name,
      isCritical: currentTest.isCritical,
      duration,
      fps: fpsMeasurement,
      timestamp: animationEnd,
    };

    console.log(
      `✅ [Performance Test] ${result.spellName} ${result.isCritical ? '(CRIT)' : ''} completed:`,
      {
        duration: `${duration.toFixed(2)}ms`,
        avgFPS: fpsMeasurement.average.toFixed(1),
        minFPS: fpsMeasurement.min.toFixed(1),
        frameDrops: fpsMeasurement.frameDrops,
      }
    );

    setResults(prevResults => [...prevResults, result]);

    // Clear active animation
    setActiveAnimation(null);

    // Move to next animation in queue
    const currentIndex = testQueue.current.findIndex(
      t => t.spell.id === currentTest.spell.id && t.isCritical === currentTest.isCritical
    );

    const nextIndex = currentIndex + 1;

    if (nextIndex < testQueue.current.length) {
      // Add small delay between animations for realistic testing
      setTimeout(
        () => {
          const nextTest = testQueue.current[nextIndex];
          setCurrentTest(nextTest);
          triggerAnimation(nextTest.spell, nextTest.isCritical);
        },
        testMode === 'stress' ? 100 : 500
      ); // Faster in stress test mode
    } else {
      // Test complete
      completeTest();
    }
  }, [currentTest, testMode]);

  /**
   * Complete the test and generate report
   */
  const completeTest = () => {
    const testEnd = performance.now();
    fpsMonitor.current.stop();

    console.log('🏁 [Performance Test] All animations complete. Generating report...');

    setIsRunning(false);
    setTestComplete(true);

    // Generate report in next tick to ensure all results are recorded
    setTimeout(() => {
      generateReport(testEnd);
    }, 100);
  };

  /**
   * Generate performance report
   */
  const generateReport = (testEnd: number) => {
    const totalDuration = testEnd - testStartTime.current;

    // Calculate overall FPS across all animations
    const allFPSSamples = results.flatMap(r => r.fps.samples);
    const overallFPS: FPSMeasurement = {
      average: allFPSSamples.reduce((a, b) => a + b, 0) / allFPSSamples.length,
      min: Math.min(...allFPSSamples),
      max: Math.max(...allFPSSamples),
      frameDrops: allFPSSamples.filter(fps => fps < 55).length,
      samples: allFPSSamples,
    };

    // Check if test passed
    const failureReasons: string[] = [];
    let passed = true;

    // Target: 60fps average (allowing some variance)
    if (overallFPS.average < 55) {
      failureReasons.push(
        `Average FPS ${overallFPS.average.toFixed(1)} below target (55fps minimum)`
      );
      passed = false;
    }

    // Check for excessive frame drops (more than 10% of frames)
    const frameDropPercentage = (overallFPS.frameDrops / allFPSSamples.length) * 100;
    if (frameDropPercentage > 10) {
      failureReasons.push(`${frameDropPercentage.toFixed(1)}% frame drops (max 10% allowed)`);
      passed = false;
    }

    // Check individual animations
    results.forEach(result => {
      if (result.fps.average < 50) {
        failureReasons.push(
          `${result.spellName} ${result.isCritical ? '(CRIT)' : ''} averaged ${result.fps.average.toFixed(1)}fps`
        );
        passed = false;
      }
    });

    const performanceReport: PerformanceReport = {
      testStartTime: testStartTime.current,
      testEndTime: testEnd,
      totalDuration,
      results,
      overallFPS,
      passed,
      failureReasons,
    };

    setReport(performanceReport);

    // Log summary
    console.log('📊 [Performance Test] REPORT GENERATED:');
    console.log(`   Test Duration: ${totalDuration.toFixed(0)}ms`);
    console.log(`   Animations Tested: ${results.length}`);
    console.log(
      `   Overall FPS: ${overallFPS.average.toFixed(1)} (min: ${overallFPS.min.toFixed(1)}, max: ${overallFPS.max.toFixed(1)})`
    );
    console.log(`   Frame Drops: ${overallFPS.frameDrops} (${frameDropPercentage.toFixed(1)}%)`);
    console.log(`   Result: ${passed ? '✅ PASSED' : '❌ FAILED'}`);

    if (!passed) {
      console.log('   Failure Reasons:');
      failureReasons.forEach(reason => console.log(`      - ${reason}`));
    }
  };

  /**
   * Stop the test
   */
  const stopTest = () => {
    fpsMonitor.current.stop();
    setIsRunning(false);
    setActiveAnimation(null);
    setCurrentTest(null);
    testQueue.current = [];
  };

  /**
   * Export report to JSON
   */
  const exportReport = () => {
    if (!report) return;

    const reportData = {
      ...report,
      testConfiguration: {
        mode: testMode,
        includeCriticals,
      },
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `animation-performance-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    console.log('💾 [Performance Test] Report exported');
  };

  // ================================================================
  // RENDER
  // ================================================================

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
        overflow: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: '0 0 10px 0' }}>Animation Performance Test</h1>
        <p style={{ margin: '0', color: '#888' }}>
          Task 7.8: Verify 60fps performance across all spell animations
        </p>
      </div>

      {/* Test Controls */}
      <div
        style={{
          backgroundColor: '#2a2a2a',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
        }}
      >
        <h2 style={{ marginTop: '0' }}>Test Configuration</h2>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Test Mode:</label>
          <select
            value={testMode}
            onChange={e => setTestMode(e.target.value as 'sequential' | 'stress')}
            disabled={isRunning}
            style={{
              padding: '8px',
              backgroundColor: '#1a1a1a',
              color: '#fff',
              border: '1px solid #444',
              borderRadius: '4px',
            }}
          >
            <option value='sequential'>Sequential (500ms delay)</option>
            <option value='stress'>Stress Test (100ms delay)</option>
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type='checkbox'
              checked={includeCriticals}
              onChange={e => setIncludeCriticals(e.target.checked)}
              disabled={isRunning}
              style={{ marginRight: '8px' }}
            />
            Include Critical Hit Variants
          </label>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={startTest}
            disabled={isRunning}
            style={{
              padding: '10px 20px',
              backgroundColor: isRunning ? '#444' : '#4caf50',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
            }}
          >
            {isRunning ? 'Test Running...' : 'Start Test'}
          </button>

          {isRunning && (
            <button
              onClick={stopTest}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f44336',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Stop Test
            </button>
          )}

          {report && (
            <button
              onClick={exportReport}
              style={{
                padding: '10px 20px',
                backgroundColor: '#2196f3',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Export Report
            </button>
          )}
        </div>
      </div>

      {/* Test Progress */}
      {isRunning && currentTest && (
        <div
          style={{
            backgroundColor: '#2a2a2a',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ marginTop: '0' }}>Current Test</h2>
          <p style={{ margin: '0', fontSize: '18px' }}>
            <strong>{currentTest.spell.name}</strong>{' '}
            {currentTest.isCritical ? '(CRITICAL HIT)' : '(Normal Hit)'}
          </p>
          <p style={{ margin: '5px 0 0 0', color: '#888' }}>
            Progress: {currentTest.index + 1} / {testQueue.current.length}
          </p>
        </div>
      )}

      {/* Performance Report */}
      {report && (
        <div
          style={{
            backgroundColor: '#2a2a2a',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ marginTop: '0' }}>Performance Report</h2>

          {/* Overall Result */}
          <div
            style={{
              padding: '15px',
              backgroundColor: report.passed ? '#1b5e20' : '#b71c1c',
              borderRadius: '4px',
              marginBottom: '20px',
            }}
          >
            <h3 style={{ margin: '0 0 10px 0' }}>
              {report.passed ? '✅ TEST PASSED' : '❌ TEST FAILED'}
            </h3>
            {!report.passed && (
              <div>
                <p style={{ margin: '5px 0', fontWeight: 'bold' }}>Failure Reasons:</p>
                <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                  {report.failureReasons.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Overall Stats */}
          <div style={{ marginBottom: '20px' }}>
            <h3>Overall Statistics</h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '10px',
              }}
            >
              <StatCard
                label='Test Duration'
                value={`${(report.totalDuration / 1000).toFixed(2)}s`}
              />
              <StatCard label='Animations Tested' value={report.results.length.toString()} />
              <StatCard
                label='Average FPS'
                value={report.overallFPS.average.toFixed(1)}
                status={report.overallFPS.average >= 55 ? 'good' : 'bad'}
              />
              <StatCard
                label='Min FPS'
                value={report.overallFPS.min.toFixed(1)}
                status={report.overallFPS.min >= 50 ? 'good' : 'bad'}
              />
              <StatCard label='Max FPS' value={report.overallFPS.max.toFixed(1)} />
              <StatCard
                label='Frame Drops'
                value={`${report.overallFPS.frameDrops} (${((report.overallFPS.frameDrops / report.overallFPS.samples.length) * 100).toFixed(1)}%)`}
                status={
                  report.overallFPS.frameDrops / report.overallFPS.samples.length < 0.1
                    ? 'good'
                    : 'bad'
                }
              />
            </div>
          </div>

          {/* Individual Results */}
          <div>
            <h3>Individual Animation Results</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1a1a1a' }}>
                    <th style={tableHeaderStyle}>Spell</th>
                    <th style={tableHeaderStyle}>Type</th>
                    <th style={tableHeaderStyle}>Duration</th>
                    <th style={tableHeaderStyle}>Avg FPS</th>
                    <th style={tableHeaderStyle}>Min FPS</th>
                    <th style={tableHeaderStyle}>Frame Drops</th>
                    <th style={tableHeaderStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.results.map((result, i) => {
                    const passed = result.fps.average >= 50 && result.fps.min >= 45;
                    return (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#2a2a2a' : '#333' }}>
                        <td style={tableCellStyle}>{result.spellName}</td>
                        <td style={tableCellStyle}>
                          <span
                            style={{
                              padding: '2px 6px',
                              backgroundColor: result.isCritical ? '#d32f2f' : '#1976d2',
                              borderRadius: '3px',
                              fontSize: '12px',
                            }}
                          >
                            {result.isCritical ? 'CRIT' : 'Normal'}
                          </span>
                        </td>
                        <td style={tableCellStyle}>{result.duration.toFixed(0)}ms</td>
                        <td style={tableCellStyle}>{result.fps.average.toFixed(1)}</td>
                        <td style={tableCellStyle}>{result.fps.min.toFixed(1)}</td>
                        <td style={tableCellStyle}>{result.fps.frameDrops}</td>
                        <td style={tableCellStyle}>{passed ? '✅' : '❌'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Animation Test Container */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          pointerEvents: 'none',
          zIndex: 9999,
          display: activeAnimation ? 'block' : 'none',
        }}
      >
        {activeAnimation && (
          <AnimationController
            attackType={activeAnimation.attackType}
            attackData={activeAnimation.attackData}
            onComplete={handleAnimationComplete}
            isActive={activeAnimation.isActive}
          />
        )}
      </div>
    </div>
  );
};

// ================================================================
// HELPER COMPONENTS
// ================================================================

const StatCard: React.FC<{
  label: string;
  value: string;
  status?: 'good' | 'bad';
}> = ({ label, value, status }) => (
  <div
    style={{
      padding: '15px',
      backgroundColor: '#1a1a1a',
      borderRadius: '4px',
      border: status ? `2px solid ${status === 'good' ? '#4caf50' : '#f44336'}` : '1px solid #444',
    }}
  >
    <div style={{ fontSize: '12px', color: '#888', marginBottom: '5px' }}>{label}</div>
    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{value}</div>
  </div>
);

const tableHeaderStyle: React.CSSProperties = {
  padding: '12px',
  textAlign: 'left',
  borderBottom: '2px solid #444',
};

const tableCellStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid #444',
};

export default AnimationPerformanceTest;
