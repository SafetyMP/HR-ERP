import type {
  ConnectorAdapter,
  ConnectorEvent,
} from "@/lib/connectors/sdk";

/**
 * Reference General Ledger (GL) posting connector.
 *
 * Consumes `payroll.pay_run.computed` events and produces a GL journal
 * entry shape that downstream ERPs (NetSuite, SAP, QuickBooks Online)
 * can ingest. Posting is intentionally pluggable so the same adapter
 * can be paired with multiple integrations.
 */

export interface GLLine {
  accountCode: string;
  amountMinor: bigint;
  side: "DEBIT" | "CREDIT";
  memo?: string;
}

export interface GLJournalEntry {
  /** Unique identifier — derived from the pay run for idempotency. */
  externalId: string;
  postingDate: string;
  currencyCode: string;
  description: string;
  lines: GLLine[];
}

export interface PayrollComputedPayload {
  payrollPeriodId: string;
  startDate: string;
  endDate: string;
  computed: number;
  totalEmployees: number;
  /** Currency-coded gross/net totals if the source provides them. */
  totals?: {
    grossPayMinor?: string | number;
    netPayMinor?: string | number;
    employerTaxMinor?: string | number;
    currencyCode?: string;
  };
}

export interface GLConfig {
  /** Account code map keyed by domain category. */
  accounts: {
    grossPayDebit: string;
    netPayCredit: string;
    employerTaxDebit?: string;
    employerTaxCredit?: string;
  };
  poster?: (entry: GLJournalEntry) => Promise<void>;
}

export function makeGLAdapter(
  config: GLConfig,
): ConnectorAdapter<PayrollComputedPayload, GLJournalEntry> {
  return {
    id: "gl-post",
    eventTypes: ["domain.payroll.payroll.pay_run.computed"],
    transform(event) {
      const totals = event.payload.totals;
      if (!totals?.netPayMinor || !totals?.grossPayMinor) return null;
      const currencyCode = totals.currencyCode ?? "USD";
      const lines: GLLine[] = [
        {
          accountCode: config.accounts.grossPayDebit,
          amountMinor: BigInt(totals.grossPayMinor),
          side: "DEBIT",
          memo: "Gross payroll expense",
        },
        {
          accountCode: config.accounts.netPayCredit,
          amountMinor: BigInt(totals.netPayMinor),
          side: "CREDIT",
          memo: "Net pay clearing",
        },
      ];
      if (
        totals.employerTaxMinor !== undefined &&
        config.accounts.employerTaxDebit &&
        config.accounts.employerTaxCredit
      ) {
        lines.push(
          {
            accountCode: config.accounts.employerTaxDebit,
            amountMinor: BigInt(totals.employerTaxMinor),
            side: "DEBIT",
            memo: "Employer payroll tax",
          },
          {
            accountCode: config.accounts.employerTaxCredit,
            amountMinor: BigInt(totals.employerTaxMinor),
            side: "CREDIT",
            memo: "Employer payroll tax payable",
          },
        );
      }
      return {
        externalId: `payroll:${event.payload.payrollPeriodId}`,
        postingDate: event.payload.endDate,
        currencyCode,
        description: `Payroll for ${event.payload.startDate} → ${event.payload.endDate} (${event.payload.computed} computed)`,
        lines,
      };
    },
    async emit(event, output) {
      if (config.poster) await config.poster(output);
      void event;
    },
  };
}

export type { ConnectorEvent };
