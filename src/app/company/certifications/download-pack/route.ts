import { NextResponse } from 'next/server';

import { buildZipArchive, certificationRecords, exportComplianceNotes, restrictedCountryNotes } from '@/lib/certifications';

export async function GET() {
  const certificateMatrix = [
    'code,title,applicable_lines,issuer',
    ...certificationRecords.map((record) => `${record.code},${record.title},"${record.applicableLines.join(' / ')}","${record.issuer}"`),
  ].join('\n');
  const exportNotes = [
    'STEPMOTECH Export Compliance Notes',
    '',
    ...exportComplianceNotes,
    '',
    'Restricted destination notes',
    ...restrictedCountryNotes,
  ].join('\n');
  const manifest = [
    'STEPMOTECH Compliance Pack',
    '',
    'Contents:',
    '- certificate-matrix.csv',
    '- export-notes.txt',
    '',
    'For signed or audited supporting files, use the technical support contact route.',
  ].join('\n');

  const archive = buildZipArchive([
    { name: 'manifest.txt', content: manifest },
    { name: 'certificate-matrix.csv', content: certificateMatrix },
    { name: 'export-notes.txt', content: exportNotes },
  ]);

  return new NextResponse(archive, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="stepmotech-compliance-pack.zip"',
      'Cache-Control': 'no-store',
    },
  });
}