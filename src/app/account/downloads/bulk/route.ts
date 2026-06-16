import { NextResponse } from 'next/server';

import { accountDownloadRecords } from '@/lib/account-portal';
import { buildZipArchive } from '@/lib/certifications';

export async function GET() {
  const updatedRecords = accountDownloadRecords.filter((record) => record.updated);
  const manifest = [
    'STEPMOTECH Account Download Update Pack',
    '',
    `Updated file count: ${updatedRecords.length}`,
    '',
    ...updatedRecords.map((record) => `${record.fileName} | ${record.version} | ${record.language} | ${record.updatedAt} | ${record.href}`),
  ].join('\n');
  const csv = [
    'file_name,type,version,language,updated_at,download_path',
    ...updatedRecords.map((record) => `${record.fileName},${record.type},${record.version},${record.language},${record.updatedAt},${record.href}`),
  ].join('\n');

  const archive = buildZipArchive([
    { name: 'manifest.txt', content: manifest },
    { name: 'updated-downloads.csv', content: csv },
  ]);

  return new NextResponse(archive, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="stepmotech-account-updated-docs.zip"',
      'Cache-Control': 'no-store',
    },
  });
}