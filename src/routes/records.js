import express from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import { getJsonFromS3, updateJsonInS3 } from '../services/s3DatabaseService.js';
import { getPdfStreamFromS3 } from '../services/awsS3Service.js';

const router = express.Router();

// @route   GET /api/records
// @desc    Fetch statement history records. Admins see all, users see their own.
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    let records = [];
    try {
      records = await getJsonFromS3('records.json');
    } catch (e) {
      records = [];
    }

    const isAdmin = ['admin', 'super_admin'].includes(req.user.role.toLowerCase());

    if (!isAdmin) {
      records = records.filter(r => r.userId === req.user.id);
    }

    // Sort by processedAt descending
    records.sort((a, b) => new Date(b.processedAt || b.uploadDate) - new Date(a.processedAt || a.uploadDate));

    res.json({
      status: 'success',
      data: records
    });
  } catch (error) {
    console.error('Fetch Records Error:', error.message);
    res.status(500).json({ error: 'Server error while fetching history records.' });
  }
});

// @route   GET /api/records/:id/pdf
// @desc    Download the original PDF. Super Admin only.
// @access  Private (Super Admin)
router.get('/:id/pdf', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    let records = [];
    try {
      records = await getJsonFromS3('records.json');
    } catch (e) {
      records = [];
    }

    const record = records.find(r => r.id === req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    if (!record.pdfS3Key) {
      return res.status(404).json({ error: 'PDF not available for this record.' });
    }

    const pdfStream = await getPdfStreamFromS3(record.pdfS3Key);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${(record.clientName || 'Statement').replace(/[^a-zA-Z0-9 ]/g, '')}.pdf"`);
    
    pdfStream.on('error', (streamErr) => {
      console.error('PDF Stream Error:', streamErr);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream PDF from S3.' });
      }
    });

    pdfStream.pipe(res);
  } catch (error) {
    console.error('Download PDF Error:', error.message);
    res.status(500).json({ error: 'Server error while downloading PDF.' });
  }
});

// @route   PATCH /api/records/:id/status
// @desc    Update record status (e.g., Approve & Lock)
// @access  Private
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required.' });
    }

    const targetId = req.params.id;
    const requestingUser = req.user;

    // ACID: Atomic read-modify-write — prevents lost updates on concurrent approvals
    await updateJsonInS3('records.json', (records) => {
      const recordIndex = records.findIndex(r => r.id === targetId);
      if (recordIndex === -1) {
        const err = new Error('Record not found.');
        err.status = 404;
        throw err;
      }
      const isAdmin = ['admin', 'super_admin'].includes(requestingUser.role.toLowerCase());
      if (!isAdmin && records[recordIndex].userId !== requestingUser.id) {
        const err = new Error('Unauthorized to update this record.');
        err.status = 403;
        throw err;
      }
      records[recordIndex].status = status;
      return records;
    });

    res.json({ status: 'success', message: 'Record status updated.' });
  } catch (error) {
    console.error('Update Record Status Error:', error.message);
    res.status(error.status || 500).json({ error: error.message || 'Server error while updating record status.' });
  }
});

export default router;
