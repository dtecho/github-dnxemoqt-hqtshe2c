import { Matrix } from 'ml-matrix';
import { euclidean } from 'ml-distance';

export interface ESNConfig {
  inputSize: number;
  reservoirSize: number;
  outputSize: number;
  spectralRadius?: number;
  connectivity?: number;
  inputScaling?: number;
  biasScaling?: number;
  leakingRate?: number;
}

export class EchoStateNetwork {
  private inputSize: number;
  private reservoirSize: number;
  private outputSize: number;
  private spectralRadius: number;
  private connectivity: number;
  private inputScaling: number;
  private biasScaling: number;
  private leakingRate: number;

  private inputWeights: Matrix;
  private reservoirWeights: Matrix;
  private outputWeights: Matrix | null;
  private biasWeights: Matrix;
  private reservoirState: Matrix;

  constructor(config: ESNConfig) {
    this.inputSize = config.inputSize;
    this.reservoirSize = config.reservoirSize;
    this.outputSize = config.outputSize;
    this.spectralRadius = config.spectralRadius || 0.99;
    this.connectivity = config.connectivity || 0.1;
    this.inputScaling = config.inputScaling || 1.0;
    this.biasScaling = config.biasScaling || 0.1;
    this.leakingRate = config.leakingRate || 1.0;

    // Initialize weights
    this.inputWeights = this.initializeInputWeights();
    this.reservoirWeights = this.initializeReservoirWeights();
    this.outputWeights = null;
    this.biasWeights = this.initializeBiasWeights();
    this.reservoirState = Matrix.zeros(1, this.reservoirSize);
  }

  private initializeInputWeights(): Matrix {
    const weights = Matrix.random(this.reservoirSize, this.inputSize);
    return weights.mul(this.inputScaling);
  }

  private initializeReservoirWeights(): Matrix {
    // Create sparse random matrix
    const weights = Matrix.zeros(this.reservoirSize, this.reservoirSize);
    const totalElements = this.reservoirSize * this.reservoirSize;
    const nonZeroElements = Math.floor(totalElements * this.connectivity);

    for (let i = 0; i < nonZeroElements; i++) {
      const row = Math.floor(Math.random() * this.reservoirSize);
      const col = Math.floor(Math.random() * this.reservoirSize);
      weights.set(row, col, Math.random() * 2 - 1);
    }

    // Scale to desired spectral radius
    const eigenvalues = weights.eigenvalues();
    const maxEigenvalue = Math.max(...eigenvalues.map(Math.abs));
    return weights.mul(this.spectralRadius / maxEigenvalue);
  }

  private initializeBiasWeights(): Matrix {
    const weights = Matrix.random(this.reservoirSize, 1);
    return weights.mul(this.biasScaling);
  }

  private activate(x: number[]): void {
    const input = Matrix.columnVector(x);
    
    // Update reservoir state
    const inputContribution = this.inputWeights.mmul(input);
    const reservoirContribution = this.reservoirWeights.mmul(this.reservoirState.transpose());
    const biasContribution = this.biasWeights;

    const newState = inputContribution
      .add(reservoirContribution)
      .add(biasContribution)
      .map(Math.tanh);

    // Apply leaking rate
    this.reservoirState = this.reservoirState
      .mul(1 - this.leakingRate)
      .add(newState.transpose().mul(this.leakingRate));
  }

  public train(inputs: number[][], outputs: number[][]): void {
    const stateCollector: number[][] = [];
    const targetCollector: number[][] = [];

    // Collect states
    for (let i = 0; i < inputs.length; i++) {
      this.activate(inputs[i]);
      stateCollector.push(this.reservoirState.to1DArray());
      targetCollector.push(outputs[i]);
    }

    // Solve for output weights using ridge regression
    const X = new Matrix(stateCollector);
    const Y = new Matrix(targetCollector);
    const ridge = 1e-6;

    const XtX = X.transpose().mmul(X);
    const I = Matrix.eye(this.reservoirSize, this.reservoirSize).mul(ridge);
    const Xt = X.transpose();
    
    this.outputWeights = XtX.add(I)
      .inverse()
      .mmul(Xt)
      .mmul(Y);
  }

  public predict(input: number[]): number[] {
    if (!this.outputWeights) {
      throw new Error('Network not trained');
    }

    this.activate(input);
    const output = this.reservoirState.mmul(this.outputWeights);
    return output.to1DArray();
  }

  public reset(): void {
    this.reservoirState = Matrix.zeros(1, this.reservoirSize);
  }

  public getState(): number[] {
    return this.reservoirState.to1DArray();
  }

  public setState(state: number[]): void {
    if (state.length !== this.reservoirSize) {
      throw new Error('Invalid state size');
    }
    this.reservoirState = Matrix.rowVector(state);
  }
}

// Create a server-side ESN service
let esnService: EchoStateNetwork | null = null;

export const getESNService = (config?: ESNConfig) => {
  if (!esnService && config) {
    esnService = new EchoStateNetwork(config);
  }
  return esnService;
};