import mongoose from 'mongoose';

// This is the exact schema we designed in our SRS Document!
// Your Database Developer will use this structure to save templates for different banks.
const bankTemplateSchema = new mongoose.Schema({
  bankName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  documentType: {
    type: String,
    required: true,
  },
  extractionRules: {
    columnsRequired: {
      type: [String],
      required: true,
    },
    geminiPrompt: {
      type: String,
      required: true,
    }
  }
}, { timestamps: true });

export default mongoose.model('BankTemplate', bankTemplateSchema);
