export type SalaryBandRow = {
  grade: string;
  currency: string;
  minimum: number;
  midpoint: number;
  maximum: number;
};

export const sampleSalaryBands: SalaryBandRow[] = [
  { grade: "L3", currency: "USD", minimum: 82000, midpoint: 96000, maximum: 118000 },
  { grade: "L4", currency: "USD", minimum: 105000, midpoint: 128000, maximum: 152000 },
  { grade: "L5", currency: "USD", minimum: 132000, midpoint: 158000, maximum: 184000 },
  { grade: "L6", currency: "USD", minimum: 165000, midpoint: 198000, maximum: 226000 },
];
