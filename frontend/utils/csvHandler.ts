import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

const BRAIN_DIR = 'C:/Users/gamin/.gemini/antigravity/brain/56996d89-8038-4735-9083-d78615b92189';

export async function updateTestResult(fileName: string, testCaseId: string, result: string, status: 'Passed' | 'Failed' | 'Blocked', comment: string = '') {
  const filePath = path.join(BRAIN_DIR, fileName);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  const updatedRecords = records.map((record: any) => {
    if (record['Test Case ID'] === testCaseId) {
      return {
        ...record,
        'Actual Result': result,
        'Status': status,
        'Comment': comment,
      };
    }
    return record;
  });

  const output = stringify(updatedRecords, {
    header: true,
  });

  fs.writeFileSync(filePath, output);
}

export function getTestCases(fileName: string) {
  const filePath = path.join(BRAIN_DIR, fileName);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  return parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });
}
