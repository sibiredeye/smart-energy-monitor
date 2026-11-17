import { SmartMeterTelemetry } from '../types';

export interface UseSmartMeterSimulatorReturn {
  isActive: boolean;
  telemetry: SmartMeterTelemetry;
  history: SmartMeterTelemetry[];
  toggleSimulation: () => void;
  startSimulation: () => void;
  stopSimulation: () => void;
  resetAccumulated: () => void;
}

export declare function useSmartMeterSimulator(initialActive?: boolean): UseSmartMeterSimulatorReturn;

export default useSmartMeterSimulator;
