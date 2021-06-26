interface IGobang {
  readonly black: number;
  readonly white: number | null;
  readonly _board: string[][];
  readonly offensive: boolean;
  readonly history: number[][];
  readonly timeout: NodeJS.Timeout;
}