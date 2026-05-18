import type { AuthorityRecord } from "@authoritymatch/core";
import { z } from "zod";

const FMCSA_API_URL =
  process.env.FMCSA_API_URL || "https://mobile.fmcsa.dot.gov/qc/services";
const FMCSA_API_KEY = process.env.FMCSA_API_KEY;

if (!FMCSA_API_KEY) {
  console.warn("⚠️ FMCSA_API_KEY not set - API features disabled");
}

// FMCSA API Response schemas
const CarrierSchema = z.object({
  dotNumber: z.string(),
  legalName: z.string().optional(),
  dbaName: z.string().optional(),
  carrierOperation: z.string().optional(),
  phyStreet: z.string().optional(),
  phyCity: z.string().optional(),
  phyState: z.string().optional(),
  phyZipcode: z.string().optional(),
  mailStreet: z.string().optional(),
  mailCity: z.string().optional(),
  mailState: z.string().optional(),
  mailZipcode: z.string().optional(),
  telephone: z.string().optional(),
  fax: z.string().optional(),
  emailAddress: z.string().optional(),
  MCS150Date: z.string().optional(),
  addDate: z.string().optional(),
  totalDrivers: z.number().optional(),
  totalPowerUnits: z.number().optional(),
  statusCode: z.string().optional(),
});

const SafetyRatingSchema = z.object({
  rating: z.string().optional(),
  reviewDate: z.string().optional(),
  reviewType: z.string().optional(),
});

interface InsuranceData {
  form?: string;
  type?: string;
  coverageFrom?: string;
  coverageTo?: string;
  effectiveDate?: string;
  cancellationDate?: string;
  status?: string;
}

const InsuranceSchema = z.object({
  form: z.string().optional(),
  type: z.string().optional(),
  coverageFrom: z.string().optional(),
  coverageTo: z.string().optional(),
  effectiveDate: z.string().optional(),
  cancellationDate: z.string().optional(),
  status: z.string().optional(),
});

export interface FMCSACarrier {
  dotNumber: string;
  legalName?: string;
  dbaName?: string;
  carrierOperation?: string;
  phyStreet?: string;
  phyCity?: string;
  phyState?: string;
  phyZipcode?: string;
  telephone?: string;
  emailAddress?: string;
  MCS150Date?: string;
  addDate?: string;
  totalDrivers?: number;
  totalPowerUnits?: number;
  statusCode?: string;
  safetyRating?: {
    rating?: string;
    reviewDate?: string;
  };
  insurance?: InsuranceData;
}

export interface FetchOptions {
  since?: Date;
  state?: string;
  limit?: number;
  offset?: number;
}

export interface ChangeDetectionResult {
  dotNumber: string;
  changes: FieldChange[];
  previous: Partial<AuthorityRecord>;
  current: Partial<AuthorityRecord>;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: Date;
}

export interface FieldChange {
  field: string;
  oldValue: any;
  newValue: any;
  importance: "minor" | "major" | "critical";
}

// Transform FMCSA API response to AuthorityRecord format
export function transformFMCSACarrier(
  carrier: FMCSACarrier,
): Partial<AuthorityRecord> {
  return {
    dotNumber: carrier.dotNumber,
    legalName: carrier.legalName,
    dbaName: carrier.dbaName,
    state: carrier.phyState,
    status: carrier.statusCode,
    carrierOperation: carrier.carrierOperation,
    physicalAddress: carrier.phyStreet
      ? {
          street: carrier.phyStreet,
          city: carrier.phyCity || "",
          state: carrier.phyState || "",
          zip: carrier.phyZipcode || "",
        }
      : undefined,
    phone: carrier.telephone,
    email: carrier.emailAddress,
    mcs150Date: carrier.MCS150Date,
    addDate: carrier.addDate,
    totalDrivers: carrier.totalDrivers,
    totalPowerUnits: carrier.totalPowerUnits,
    safetyRating: carrier.safetyRating?.rating,
    lastSafetyReview: carrier.safetyRating?.reviewDate,
    updatedAt: new Date().toISOString(),
    source: "FMCSA_API",
  };
}

// Fetch carrier details from FMCSA API
export async function fetchCarrierDetails(
  dotNumber: string,
): Promise<FMCSACarrier | null> {
  if (!FMCSA_API_KEY) {
    throw new Error("FMCSA_API_KEY not configured");
  }

  const url = `${FMCSA_API_URL}/carriers/${dotNumber}?webKey=${FMCSA_API_KEY}`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(30000),
    });

    if (response.status === 404) {
      return null; // Carrier not found
    }

    if (!response.ok) {
      throw new Error(
        `FMCSA API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    const parsed = CarrierSchema.safeParse(data.content);

    if (!parsed.success) {
      console.error("Invalid carrier data:", parsed.error);
      return null;
    }

    // Fetch safety rating separately
    const safetyUrl = `${FMCSA_API_URL}/carriers/${dotNumber}/safer/safetyrating?webKey=${FMCSA_API_KEY}`;
    const safetyResponse = await fetch(safetyUrl, {
      signal: AbortSignal.timeout(30000),
    });

    if (safetyResponse.ok) {
      const safetyData = await safetyResponse.json();
      parsed.data.safetyRating = safetyData.content;
    }

    return parsed.data;
  } catch (error) {
    console.error(`Failed to fetch carrier ${dotNumber}:`, error);
    throw error;
  }
}

// Fetch carriers updated since a date (for daily sync)
export async function fetchUpdatedCarriers(
  options: FetchOptions = {},
): Promise<FMCSACarrier[]> {
  if (!FMCSA_API_KEY) {
    throw new Error("FMCSA_API_KEY not configured");
  }

  const carriers: FMCSACarrier[] = [];
  let offset = options.offset || 0;
  const limit = Math.min(options.limit || 1000, 1000); // FMCSA max is 1000
  let hasMore = true;

  while (hasMore && carriers.length < (options.limit || Infinity)) {
    const params = new URLSearchParams({
      webKey: FMCSA_API_KEY,
      size: limit.toString(),
      start: offset.toString(),
      ...(options.state && { state: options.state }),
      ...(options.since && {
        updatedSince: options.since.toISOString().split("T")[0],
      }),
    });

    const url = `${FMCSA_API_URL}/carriers?${params}`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(
        `FMCSA API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    const batch = data.content || [];

    if (batch.length === 0) {
      hasMore = false;
      break;
    }

    for (const carrier of batch) {
      const parsed = CarrierSchema.safeParse(carrier);
      if (parsed.success) {
        carriers.push(parsed.data);
      }
    }

    offset += batch.length;

    // Rate limiting - be nice to FMCSA servers
    await new Promise((r) => setTimeout(r, 100));
  }

  return carriers;
}

// Detect changes between old and new record
export function detectChanges(
  previous: Partial<AuthorityRecord>,
  current: Partial<AuthorityRecord>,
): FieldChange[] {
  const changes: FieldChange[] = [];

  const criticalFields = [
    "status",
    "safetyRating",
    "insuranceStatus",
    "dotNumber",
  ];
  const majorFields = [
    "legalName",
    "dbaName",
    "physicalAddress",
    "totalDrivers",
    "totalPowerUnits",
  ];

  for (const key of Object.keys(current)) {
    const oldVal = previous[key as keyof AuthorityRecord];
    const newVal = current[key as keyof AuthorityRecord];

    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      let importance: "minor" | "major" | "critical" = "minor";

      if (criticalFields.includes(key)) {
        importance = "critical";
      } else if (majorFields.includes(key)) {
        importance = "major";
      }

      changes.push({
        field: key,
        oldValue: oldVal,
        newValue: newVal,
        importance,
      });
    }
  }

  return changes;
}

// Calculate severity based on changes
export function calculateSeverity(
  changes: FieldChange[],
): "low" | "medium" | "high" | "critical" {
  if (changes.some((c) => c.importance === "critical")) return "critical";
  if (changes.some((c) => c.importance === "major")) return "high";
  if (changes.length > 3) return "medium";
  return "low";
}
