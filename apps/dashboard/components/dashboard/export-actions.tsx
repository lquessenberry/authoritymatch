'use client';

import { useMemo } from 'react';
import { Download, FileJson, Table2 } from 'lucide-react';

import { Button } from '@authoritymatch/ui';

import {
  buildLeadExportCsv,
  type ApiConnection,
  type ExportTarget,
  type FactoringCompanyProfile,
  type LeadRecord,
} from '@/lib/factoring-dashboard';

type ExportActionsProps = {
  company: FactoringCompanyProfile;
  leads: LeadRecord[];
  exportTargets: ExportTarget[];
  apiConnections: ApiConnection[];
  preferredFormat?: 'json' | 'csv';
};

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ExportActions({
  company,
  leads,
  exportTargets,
  apiConnections,
  preferredFormat = 'json',
}: ExportActionsProps) {
  const jsonPayload = useMemo(
    () =>
      JSON.stringify(
        {
          company,
          generatedAt: new Date().toISOString(),
          leads,
          exportTargets,
          apiConnections,
        },
        null,
        2
      ),
    [apiConnections, company, exportTargets, leads]
  );

  const csvPayload = useMemo(() => buildLeadExportCsv(leads), [leads]);

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        onClick={() =>
          downloadFile(
            `${company.slug}-dashboard-export.json`,
            jsonPayload,
            'application/json'
          )
        }
        variant={preferredFormat === 'json' ? 'default' : 'outline'}
      >
        <FileJson className="mr-2 h-4 w-4" />
        Export JSON
      </Button>
      <Button
        onClick={() =>
          downloadFile(`${company.slug}-lead-feed.csv`, csvPayload, 'text/csv')
        }
        variant={preferredFormat === 'csv' ? 'default' : 'outline'}
      >
        <Table2 className="mr-2 h-4 w-4" />
        Export CSV
      </Button>
      <Button
        variant="ghost"
        onClick={() =>
          downloadFile(
            `${company.slug}-api-manifest.json`,
            JSON.stringify(apiConnections, null, 2),
            'application/json'
          )
        }
      >
        <Download className="mr-2 h-4 w-4" />
        API manifest
      </Button>
    </div>
  );
}
