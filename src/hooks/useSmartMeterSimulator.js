import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to simulate realistic Indian single-phase smart meter telemetry.
 * 
 * Telemetry Specs:
 * - Nominal Voltage: 230V AC (Fluctuates between 220V and 240V)
 * - Current Draw: 2.5A to 16A (baseline residential loads with periodic compressor/motor inrush spikes)
 * - Power Factor: 0.88 to 0.98 (lagging inductive residential load)
 * - Active Power: P = V * I * PF (in Watts)
 * - Incremental Energy: Delta kWh = (P * 2s) / (3,600,000)
 */

const VOLTAGE_MIN = 220.0;
const VOLTAGE_MAX = 240.0;
const CURRENT_MIN = 2.5;
const CURRENT_MAX = 16.0;
const PF_MIN = 0.88;
const PF_MAX = 0.98;

export function useSmartMeterSimulator(initialActive = false) {
  const [isActive, setIsActive] = useState(initialActive);

  // Current instantaneous telemetry reading
  const [telemetry, setTelemetry] = useState(() => ({
    voltage: 230.0,
    current: 4.25,
    powerFactor: 0.95,
    activePower: 928, // Watts = 230 * 4.25 * 0.95
    incrementalKWh: 0.000516,
    accumulatedKWh: 0.0,
    isCompressorSpike: false,
    timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
  }));

  // Rolling history of recent telemetry readings (last 20 points) for live charts
  const [history, setHistory] = useState([]);

  // Internal state refs for realistic autoregressive random walks
  const voltageRef = useRef(230.0);
  const currentRef = useRef(4.5);
  const spikeCountdownRef = useRef(Math.floor(Math.random() * 5) + 6);
  const accumulatedKWhRef = useRef(0.0);

  // Generate next telemetry tick
  const generateTelemetryTick = useCallback(() => {
    // 1. Voltage: Autoregressive drift towards 230V with random jitter
    const voltageDrift = (230.0 - voltageRef.current) * 0.2;
    const voltageJitter = (Math.random() - 0.5) * 3.5;
    let nextVoltage = voltageRef.current + voltageDrift + voltageJitter;
    nextVoltage = Math.max(VOLTAGE_MIN, Math.min(VOLTAGE_MAX, nextVoltage));
    voltageRef.current = nextVoltage;
    const formattedVoltage = parseFloat(nextVoltage.toFixed(1));

    // 2. Current & Compressor Surge Simulation
    let isSpike = false;
    let nextCurrent;

    spikeCountdownRef.current -= 1;
    if (spikeCountdownRef.current <= 0) {
      // Trigger compressor / inductive motor inrush surge (14.0A - 16.0A)
      isSpike = true;
      nextCurrent = 14.0 + Math.random() * 2.0;
      // Reset countdown to next spike in 6-12 intervals (12-24 seconds)
      spikeCountdownRef.current = Math.floor(Math.random() * 7) + 6;
    } else {
      // Normal operating current fluctuation
      // Mix between low idle (2.5A - 5.5A) and moderate active load (6.0A - 11.5A)
      const currentDrift = (Math.random() - 0.5) * 1.8;
      let targetCurrent = currentRef.current + currentDrift;

      // Keep within typical residential boundary
      if (targetCurrent < CURRENT_MIN) targetCurrent = CURRENT_MIN + Math.random() * 0.8;
      if (targetCurrent > 12.0) targetCurrent = 10.5 + (Math.random() - 0.5) * 1.5;

      nextCurrent = targetCurrent;
    }

    nextCurrent = Math.max(CURRENT_MIN, Math.min(CURRENT_MAX, nextCurrent));
    currentRef.current = nextCurrent;
    const formattedCurrent = parseFloat(nextCurrent.toFixed(2));

    // 3. Power Factor (PF): Drops slightly during high inductive load/spike, higher during steady resistive
    let nextPF;
    if (isSpike) {
      nextPF = PF_MIN + Math.random() * 0.04; // 0.88 - 0.92 during surge
    } else {
      nextPF = 0.92 + Math.random() * 0.06; // 0.92 - 0.98 during steady load
    }
    nextPF = Math.max(PF_MIN, Math.min(PF_MAX, nextPF));
    const formattedPF = parseFloat(nextPF.toFixed(2));

    // 4. Active Power: P = V * I * PF (in Watts)
    const activePowerWatts = Math.round(formattedVoltage * formattedCurrent * formattedPF);

    // 5. Incremental kWh for a 2-second interval:
    // (Watts * 2 seconds) / (3600 seconds * 1000 Watts/kW)
    const tickKWh = (activePowerWatts * 2) / 3600000;
    accumulatedKWhRef.current += tickKWh;
    const formattedAccumulatedKWh = parseFloat(accumulatedKWhRef.current.toFixed(5));

    const now = new Date();
    const timeString = now.toLocaleTimeString('en-IN', { hour12: false });

    const newReading = {
      voltage: formattedVoltage,
      current: formattedCurrent,
      powerFactor: formattedPF,
      activePower: activePowerWatts,
      incrementalKWh: tickKWh,
      accumulatedKWh: formattedAccumulatedKWh,
      isCompressorSpike: isSpike,
      timestamp: timeString,
    };

    setTelemetry(newReading);

    // Keep rolling history of last 20 readings for smooth live stream chart
    setHistory((prev) => {
      const updated = [...prev, newReading];
      if (updated.length > 20) {
        return updated.slice(updated.length - 20);
      }
      return updated;
    });
  }, []);

  // Interval timer toggling every 2 seconds (2000ms)
  useEffect(() => {
    if (!isActive) return;

    // Immediately trigger a tick on activation
    generateTelemetryTick();

    const intervalId = setInterval(generateTelemetryTick, 2000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isActive, generateTelemetryTick]);

  const toggleSimulation = useCallback(() => {
    setIsActive((prev) => !prev);
  }, []);

  const startSimulation = useCallback(() => {
    setIsActive(true);
  }, []);

  const stopSimulation = useCallback(() => {
    setIsActive(false);
  }, []);

  const resetAccumulated = useCallback(() => {
    accumulatedKWhRef.current = 0.0;
    setTelemetry((prev) => ({
      ...prev,
      accumulatedKWh: 0.0,
      incrementalKWh: 0.0,
    }));
    setHistory([]);
  }, []);

  return {
    isActive,
    telemetry,
    history,
    toggleSimulation,
    startSimulation,
    stopSimulation,
    resetAccumulated,
  };
}

export default useSmartMeterSimulator;
