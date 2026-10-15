/**
 * Tipi dei contenuti marketing della landing Kinetix.
 */

export interface TechnicalSpec {
  group: string;
  parameter: string;
  value: string;
  note?: string;
}

export interface ApplicationCase {
  title: string;
  description: string;
  metric: string;
}

export interface SectorServed {
  name: string;
  parts: string;
  standard: string;
}

export interface ArchitectureComparisonRow {
  aspect: string;
  legacy: string;
  edge: string;
}
