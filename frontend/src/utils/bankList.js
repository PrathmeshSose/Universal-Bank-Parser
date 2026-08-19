/**
 * 15 Major Indian Banks + Generic AI Extractor Option (Handoff Spec Section 4)
 */

export const BANK_CATEGORIES = [
  {
    label: 'Popular Private Banks',
    banks: [
      { id: 'HDFC', name: 'HDFC Bank' },
      { id: 'ICICI', name: 'ICICI Bank' },
      { id: 'Axis', name: 'Axis Bank' },
      { id: 'Kotak Mahindra Bank', name: 'Kotak Mahindra Bank' },
      { id: 'IndusInd Bank', name: 'IndusInd Bank' },
      { id: 'IDFC FIRST Bank', name: 'IDFC FIRST Bank' },
      { id: 'YES Bank', name: 'YES Bank' },
      { id: 'Federal Bank', name: 'Federal Bank' }
    ]
  },
  {
    label: 'Major Public Sector Banks',
    banks: [
      { id: 'SBI', name: 'State Bank of India (SBI)' },
      { id: 'Punjab National Bank (PNB)', name: 'Punjab National Bank (PNB)' },
      { id: 'Bank of Baroda (BOB)', name: 'Bank of Baroda (BOB)' },
      { id: 'Canara Bank', name: 'Canara Bank' },
      { id: 'Union Bank of India', name: 'Union Bank of India' },
      { id: 'Bank of India (BOI)', name: 'Bank of India (BOI)' },
      { id: 'Indian Bank', name: 'Indian Bank' },
      { id: 'Bank of Maharashtra', name: 'Bank of Maharashtra' }
    ]
  },
  {
    label: 'Custom / Unlisted Banks',
    banks: [
      { id: 'Other', name: 'Other (Generic AI Parsing)' }
    ]
  }
];

export const ALL_BANK_IDS = BANK_CATEGORIES.flatMap(cat => cat.banks.map(b => b.id));
