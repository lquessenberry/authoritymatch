import { parse } from 'csv-parse/sync';
import { createReadStream } from 'fs';
import { Readable } from 'stream';
import type { AuthorityRecord } from '@authoritymatch/core';

// FMCSA CSV column mapping
// Based on SAFER/Authority CSV exports
interface FMCSACSVRow {
  'DOT Number': string;
  'MC Number'?: string;
  'Legal Name': string;
  'DBA Name'?: string;
  'Street Address'?: string;
  'City'?: string;
  'State'?: string;
  'Zip Code'?: string;
  'Phone'?: string;
  'Email'?: string;
  'Authority Status'?: string;
  'Authority Date'?: string;
  'Cargo Auth'?: string;
  'Passenger Auth'?: string;
  'Household Goods Auth'?: string;
  'Broker Auth'?: string;
  'Safety Rating'?: string;
  'Safety Rating Date'?: string;
  'OOS Date'?: string;
}

interface ParseOptions {
  filePath: string;
  stateFilter?: string; // e.g., 'AR' for Arkansas
  sinceDate?: Date;
  limit?: number;
}

export async function parseFMCSACSV(options: ParseOptions): Promise<Partial<AuthorityRecord>[]> {
  const { filePath, stateFilter, sinceDate, limit } = options;

  const fileContent = await Readable.toWeb(createReadStream(filePath));
  const chunks: Buffer[] = [];

  for await (const chunk of fileContent) {
    chunks.push(Buffer.from(chunk));
  }

  const csvContent = Buffer.concat(chunks).toString('utf-8');

  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as FMCSACSVRow[];

  let authorities = records.map(row => transformCSVRow(row));

  // Apply filters
  if (stateFilter) {
    authorities = authorities.filter(a => 
      a.location?.state?.toUpperCase() === stateFilter.toUpperCase()
    );
  }

  if (sinceDate) {
    authorities = authorities.filter(a => {
      if (!a.authorityDate) return false;
      return new Date(a.authorityDate) >= sinceDate;
    });
  }

  // Sort by authority date (newest first)
  authorities.sort((a, b) => {
    const dateA = a.authorityDate ? new Date(a.authorityDate).getTime() : 0;
    const dateB = b.authorityDate ? new Date(b.authorityDate).getTime() : 0;
    return dateB - dateA;
  });

  if (limit) {
    authorities = authorities.slice(0, limit);
  }

  return authorities;
}

function transformCSVRow(row: FMCSACSVRow): Partial<AuthorityRecord> {
  const mcNumber = row['MC Number']?.replace(/^MC/, '').trim() || '';
  const dotNumber = row['DOT Number']?.trim() || '';
  
  // Determine authority date from various auth fields
  let authorityDate: Date | undefined;
  const authFields = [
    row['Authority Date'],
    row['Cargo Auth'],
    row['Passenger Auth'],
    row['Household Goods Auth'],
    row['Broker Auth'],
  ];
  
  for (const dateStr of authFields) {
    if (dateStr && dateStr !== 'N/A') {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        authorityDate = parsed;
        break;
      }
    }
  }

  return {
    id: `fmcsa_${dotNumber}`,
    mcNumber: mcNumber,
    dotNumber: dotNumber,
    companyName: row['DBA Name']?.trim() || row['Legal Name']?.trim() || '',
    contactPhone: row['Phone']?.trim(),
    contactEmail: row['Email']?.trim(),
    authorityDate,
    location: {
      city: row['City']?.trim() || '',
      state: row['State']?.trim() || '',
      zip: row['Zip Code']?.trim() || '',
    },
    safetyRating: parseSafetyRating(row['Safety Rating']),
    // Default values for fields not in CSV
    equipmentTypes: [],
    factoringStatus: 'active',
    creditScore: undefined, // Will need external lookup
    monthlyVolume: undefined, // Will need to be collected
    yearsInBusiness: undefined, // Calculate from authority date
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function parseSafetyRating(rating?: string): 'satisfactory' | 'conditional' | 'unsatisfactory' | undefined {
  if (!rating) return undefined;
  const normalized = rating.toLowerCase().trim();
  if (normalized.includes('satisfactory')) return 'satisfactory';
  if (normalized.includes('conditional')) return 'conditional';
  if (normalized.includes('unsatisfactory')) return 'unsatisfactory';
  return undefined;
}
