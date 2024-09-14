import {CsvError, parse} from 'csv-parse';
import { Readable } from 'stream'; // Convert buffer to stream


export const parseCSV = (fileBuffer: Buffer): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const records: any[] = [];
    const parser = parse({
      delimiter: ',', // Adjust delimiter if necessary
      columns: true, // Optionally specify column headers
    });

    Readable.from(fileBuffer).pipe(parser)
      .on('data', (row) => {
        records.push(row);
      })
      .on('end', () => {
        resolve(records);
      })
      .on('error', (error) => {
        // Log the error message and reject the promise
        console.error('Error parsing CSV:', error);
        reject(error);
      });
  });
};
