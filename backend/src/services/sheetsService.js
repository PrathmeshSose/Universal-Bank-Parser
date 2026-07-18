import { google } from 'googleapis';

/**
 * Service to securely append verified data to Google Sheets.
 * NOTE: The Database Developer must provide the GOOGLE_APPLICATION_CREDENTIALS 
 * JSON file and set the environment variable for this to authenticate successfully.
 */
export const appendToSheet = async (spreadsheetId, dataArray) => {
  try {
    // Authenticate using the Service Account credentials
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Format our JSON objects into a flat 2D array (Row by Row) for Google Sheets
    const values = dataArray.map(item => [
      item.date || '', 
      item.description || '', 
      item.debit || '', 
      item.credit || '', 
      item.balance || ''
    ]);

    const resource = {
      values,
    };

    // Append the rows to the first available blank row in Sheet1
    const result = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:E',
      valueInputOption: 'USER_ENTERED',
      resource,
    });

    console.log(`✅ Successfully appended ${result.data.updates.updatedRows} rows to Google Sheets.`);
    return result.data;
  } catch (error) {
    console.error('❌ Google Sheets API Error:', error.message);
    throw error;
  }
};
