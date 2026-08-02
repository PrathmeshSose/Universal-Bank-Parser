import mongoose from 'mongoose';

const documentRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  s3FileUrl: {
    type: String,
    required: true,
  },
  bankName: {
    type: String,
    required: true,
    trim: true,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true // Also gives us createdAt and updatedAt for free
});

const DocumentRecord = mongoose.model('DocumentRecord', documentRecordSchema);

export default DocumentRecord;
