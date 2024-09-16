"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processUploadCsv = exports.parseCSV = void 0;
const csv_parse_1 = require("csv-parse");
const stream_1 = require("stream"); // Convert buffer to stream
const parseCSV = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const records = [];
        const parser = (0, csv_parse_1.parse)({
            delimiter: ',', // Adjust delimiter if necessary
            columns: true, // Optionally specify column headers
        });
        stream_1.Readable.from(fileBuffer).pipe(parser)
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
exports.parseCSV = parseCSV;
const processUploadCsv = async (csvBuffer, Urls, requestId) => {
};
exports.processUploadCsv = processUploadCsv;
