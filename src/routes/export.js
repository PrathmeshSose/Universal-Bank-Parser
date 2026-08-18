import express from 'express';

const router = express.Router();

// POST /api/export
// Expects: { verifiedData: [{ Date: '...', Description: '...', Debit: '...', Credit: '...', Balance: '...' }, ...] }
// Returns: A pure CSV file that the browser will automatically download
router.post('/', async (req, res) => {
  try {
    const { verifiedData } = req.body;

    if (!verifiedData || !Array.isArray(verifiedData) || verifiedData.length === 0) {
      return res.status(400).json({ status: 'error', message: 'verifiedData array is required and cannot be empty.' });
    }

    // 1. Get the column headers (Date, Description, Debit, Credit, Balance)
    const fields = Object.keys(verifiedData[0]);
    const csvRows = [];
    
    // 2. Add the Header row to the CSV
    csvRows.push(fields.join(','));

    // 3. Add all the data rows to the CSV
    for (const row of verifiedData) {
      const values = fields.map(field => {
        let val = row[field];
        if (val === null || val === undefined) val = '';
        
        // Security: Escape any commas or quotes inside the text (e.g. "Walmart, Inc.")
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');

    // 4. Send the response with headers that force the browser to download a file!
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename="verified_bank_statement.csv"');
    
    return res.status(200).send(csvString);

  } catch (error) {
    console.error('Export Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to generate CSV export.' });
  }
});

export default router;
