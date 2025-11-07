// Shared order data across all workflow pages
// This file consolidates all order data from different workflow stages

export interface WorkflowTimestamp {
  stage: string;
  enteredAt: string;
  exitedAt?: string;
  qtyProcessed: number;
}

export interface OrderData {
  id: string;
  assemblyLine: string;
  gmsoaNo: string;
  soaSrNo: string;
  assemblyDate: string;
  uniqueCode: string;
  splittedCode: string;
  party: string;
  customerPoNo: string;
  codeNo: string;
  product: string;
  qty: number;
  qtyExe: number;
  qtyPending: number;
  finishedValve: string;
  gmLogo: string;
  namePlate: string;
  productSpcl1: string;
  productSpcl2: string;
  productSpcl3: string;
  inspection: string;
  painting: string;
  remarks: string;
  alertStatus: boolean;
  workflowHistory?: WorkflowTimestamp[];
}

// Planning (Orders Page) Data
export const planningOrders: OrderData[] = [
  {
    id: '0',
    assemblyLine: 'S',
    gmsoaNo: 'SOA0210',
    soaSrNo: '25',
    assemblyDate: '27-10-2025',
    uniqueCode: 'ORD-0210-2025-25',
    splittedCode: '',
    party: 'Independence Valve & Supply',
    customerPoNo: '1030755',
    codeNo: '32GT1D9T12C3H6P3',
    product: '32MM-GTV-150#-F316/L(SS316/L)-INTFE-T12(SS316+HST6)-B8M/8M-H304/L-PTEADIT',
    qty: 20,
    qtyExe: 0,
    qtyPending: 20,
    finishedValve: 'yes',
    gmLogo: 'PVP',
    namePlate: 'PVP',
    productSpcl1: 'એરોનું ટપકું કાઢવું.',
    productSpcl2: 'WEDGE ST.6',
    productSpcl3: '',
    inspection: 'Y',
    painting: 'N',
    remarks: '',
    alertStatus: false,
    workflowHistory: [
      { stage: 'Planning', enteredAt: '2025-10-27 09:00:00', qtyProcessed: 0 }
    ]
  },
  {
    id: '4',
    assemblyLine: 'D',
    gmsoaNo: 'SOA0918',
    soaSrNo: '1',
    assemblyDate: 'HOLD',
    uniqueCode: 'ORD-0918-2025-1',
    splittedCode: '',
    party: 'John Crane Middle East F.Z.E.',
    customerPoNo: '4503254953',
    codeNo: 'OTB20GT9D13T12WBH2S3(0918)',
    product: 'OTB-20MM-GTV-1500#-F316/L(SS316/L)-BW160-T12(SS316+HST6)-WELDED-HBLK-FULL BORE-(0918)',
    qty: 11,
    qtyExe: 0,
    qtyPending: 11,
    finishedValve: 'yes',
    gmLogo: 'GM',
    namePlate: 'GM',
    productSpcl1: 'એરોનું ટપકું કાઢવું.',
    productSpcl2: 'NACE,IGC-E,PMI',
    productSpcl3: '',
    inspection: 'N',
    painting: 'N',
    remarks: '',
    alertStatus: false,
    workflowHistory: [
      { stage: 'Planning', enteredAt: '2025-10-20 10:30:00', qtyProcessed: 0 }
    ]
  }
];

// Material Issue (Orders Page 2) Data
export const materialIssueOrders: OrderData[] = [
  {
    id: '1',
    assemblyLine: 'A',
    gmsoaNo: 'SOA0776',
    soaSrNo: '3',
    assemblyDate: '20-09-2025',
    uniqueCode: 'ORD-0776-2025-3',
    splittedCode: '',
    party: 'coxBRO Engineering Pvt Ltd',
    customerPoNo: '56420',
    codeNo: '20GT8AH12T80C8H1G29',
    product: '20MM-GTV-800#-F60-BW80-T80(F60+FST6)-B8MCL2/8M-HREG-F60+GRAPHITE',
    qty: 36,
    qtyExe: 5,
    qtyPending: 31,
    finishedValve: '',
    gmLogo: 'BOS',
    namePlate: 'N',
    productSpcl1: 'એરોનું ટપકું કાઢવું.',
    productSpcl2: 'WEDGE ST.6',
    productSpcl3: 'T',
    inspection: 'N',
    painting: 'N',
    remarks: '',
    alertStatus: false,
    workflowHistory: [
      { stage: 'Planning', enteredAt: '2025-09-20 08:15:00', exitedAt: '2025-09-20 14:30:00', qtyProcessed: 0 },
      { stage: 'Material Issue', enteredAt: '2025-09-20 14:30:00', qtyProcessed: 5 }
    ]
  }
];

// Semi QC Data
export const semiQcOrders: OrderData[] = [
  {
    id: '1',
    assemblyLine: 'A',
    gmsoaNo: 'SOA0776',
    soaSrNo: '3',
    assemblyDate: '20-09-2025',
    uniqueCode: 'ORD-0776-2025-3',
    splittedCode: '',
    party: 'coxBRO Engineering Pvt Ltd',
    customerPoNo: '56420',
    codeNo: '20GT8AH12T80C8H1G29',
    product: '20MM-GTV-800#-F60-BW80-T80(F60+FST6)-B8MCL2/8M-HREG-F60+GRAPHITE',
    qty: 36,
    qtyExe: 10,
    qtyPending: 26,
    finishedValve: '',
    gmLogo: 'BOS',
    namePlate: 'N',
    productSpcl1: 'એરોનું ટપકું કાઢવું.',
    productSpcl2: 'WEDGE ST.6',
    productSpcl3: 'T',
    inspection: 'N',
    painting: 'N',
    remarks: '',
    alertStatus: false,
    workflowHistory: [
      { stage: 'Planning', enteredAt: '2025-09-20 08:15:00', exitedAt: '2025-09-20 14:30:00', qtyProcessed: 0 },
      { stage: 'Material Issue', enteredAt: '2025-09-20 14:30:00', exitedAt: '2025-09-21 10:15:00', qtyProcessed: 5 },
      { stage: 'Semi QC', enteredAt: '2025-09-21 10:15:00', qtyProcessed: 10 }
    ]
  }
];

// After Phosphating QC Data
export const afterPhosphatingQcOrders: OrderData[] = [
  {
    id: '1',
    assemblyLine: 'A',
    gmsoaNo: 'SOA0776',
    soaSrNo: '3',
    assemblyDate: '20-09-2025',
    uniqueCode: 'ORD-0776-2025-3',
    splittedCode: '',
    party: 'coxBRO Engineering Pvt Ltd',
    customerPoNo: '56420',
    codeNo: '20GT8AH12T80C8H1G29',
    product: '20MM-GTV-800#-F60-BW80-T80(F60+FST6)-B8MCL2/8M-HREG-F60+GRAPHITE',
    qty: 36,
    qtyExe: 15,
    qtyPending: 21,
    finishedValve: '',
    gmLogo: 'BOS',
    namePlate: 'N',
    productSpcl1: 'એરોનું ટપકું કાઢવું.',
    productSpcl2: 'WEDGE ST.6',
    productSpcl3: 'T',
    inspection: 'N',
    painting: 'N',
    remarks: '',
    alertStatus: false,
    workflowHistory: [
      { stage: 'Planning', enteredAt: '2025-09-20 08:15:00', exitedAt: '2025-09-20 14:30:00', qtyProcessed: 0 },
      { stage: 'Material Issue', enteredAt: '2025-09-20 14:30:00', exitedAt: '2025-09-21 10:15:00', qtyProcessed: 5 },
      { stage: 'Semi QC', enteredAt: '2025-09-21 10:15:00', exitedAt: '2025-09-22 09:45:00', qtyProcessed: 10 },
      { stage: 'After Phosphating QC', enteredAt: '2025-09-22 09:45:00', qtyProcessed: 15 }
    ]
  }
];

// Assembly Data
export const assemblyOrders: OrderData[] = [
  {
    id: '1',
    assemblyLine: 'A',
    gmsoaNo: 'SOA0776',
    soaSrNo: '3',
    assemblyDate: '20-09-2025',
    uniqueCode: 'ORD-0776-2025-3',
    splittedCode: '',
    party: 'coxBRO Engineering Pvt Ltd',
    customerPoNo: '56420',
    codeNo: '20GT8AH12T80C8H1G29',
    product: '20MM-GTV-800#-F60-BW80-T80(F60+FST6)-B8MCL2/8M-HREG-F60+GRAPHITE',
    qty: 36,
    qtyExe: 20,
    qtyPending: 16,
    finishedValve: '',
    gmLogo: 'BOS',
    namePlate: 'N',
    productSpcl1: 'એરોનું ટપકું કાઢવું.',
    productSpcl2: 'WEDGE ST.6',
    productSpcl3: 'T',
    inspection: 'N',
    painting: 'N',
    remarks: '',
    alertStatus: false,
    workflowHistory: [
      { stage: 'Planning', enteredAt: '2025-09-20 08:15:00', exitedAt: '2025-09-20 14:30:00', qtyProcessed: 0 },
      { stage: 'Material Issue', enteredAt: '2025-09-20 14:30:00', exitedAt: '2025-09-21 10:15:00', qtyProcessed: 5 },
      { stage: 'Semi QC', enteredAt: '2025-09-21 10:15:00', exitedAt: '2025-09-22 09:45:00', qtyProcessed: 10 },
      { stage: 'After Phosphating QC', enteredAt: '2025-09-22 09:45:00', exitedAt: '2025-09-23 11:20:00', qtyProcessed: 15 },
      { stage: 'Assembly', enteredAt: '2025-09-23 11:20:00', qtyProcessed: 20 }
    ]
  },
  {
    id: '2',
    assemblyLine: 'A',
    gmsoaNo: 'SOA0776',
    soaSrNo: '5',
    assemblyDate: '20-09-2025',
    uniqueCode: 'ORD-0776-2025-5',
    splittedCode: '',
    party: 'coxBRO Engineering Pvt Ltd',
    customerPoNo: '56420',
    codeNo: '20GB8AH12T80C8H1G29',
    product: '20MM-GBV-800#-F60-BW80-T80(F60+FST6)-B8MCL2/8M-HREG-F60+GRAPHITE',
    qty: 4,
    qtyExe: 2,
    qtyPending: 2,
    finishedValve: 'yes',
    gmLogo: 'BOS',
    namePlate: 'N',
    productSpcl1: '',
    productSpcl2: 'PLUG ST.6',
    productSpcl3: 'T',
    inspection: 'N',
    painting: 'N',
    remarks: '',
    alertStatus: false,
    workflowHistory: [
      { stage: 'Planning', enteredAt: '2025-09-20 08:30:00', exitedAt: '2025-09-20 15:00:00', qtyProcessed: 0 },
      { stage: 'Material Issue', enteredAt: '2025-09-20 15:00:00', exitedAt: '2025-09-21 11:00:00', qtyProcessed: 1 },
      { stage: 'Semi QC', enteredAt: '2025-09-21 11:00:00', exitedAt: '2025-09-22 10:30:00', qtyProcessed: 1 },
      { stage: 'After Phosphating QC', enteredAt: '2025-09-22 10:30:00', exitedAt: '2025-09-23 12:00:00', qtyProcessed: 2 },
      { stage: 'Assembly', enteredAt: '2025-09-23 12:00:00', qtyProcessed: 2 }
    ]
  }
];

// Testing Data
export const testingOrders: OrderData[] = [
  {
    id: '1',
    assemblyLine: 'A',
    gmsoaNo: 'SOA0776',
    soaSrNo: '3',
    assemblyDate: '20-09-2025',
    uniqueCode: 'ORD-0776-2025-3',
    splittedCode: '',
    party: 'coxBRO Engineering Pvt Ltd',
    customerPoNo: '56420',
    codeNo: '20GT8AH12T80C8H1G29',
    product: '20MM-GTV-800#-F60-BW80-T80(F60+FST6)-B8MCL2/8M-HREG-F60+GRAPHITE',
    qty: 36,
    qtyExe: 25,
    qtyPending: 11,
    finishedValve: '',
    gmLogo: 'BOS',
    namePlate: 'N',
    productSpcl1: 'એરોનું ટપકું કાઢવું.',
    productSpcl2: 'WEDGE ST.6',
    productSpcl3: 'T',
    inspection: 'N',
    painting: 'N',
    remarks: '',
    alertStatus: false,
    workflowHistory: [
      { stage: 'Planning', enteredAt: '2025-09-20 08:15:00', exitedAt: '2025-09-20 14:30:00', qtyProcessed: 0 },
      { stage: 'Material Issue', enteredAt: '2025-09-20 14:30:00', exitedAt: '2025-09-21 10:15:00', qtyProcessed: 5 },
      { stage: 'Semi QC', enteredAt: '2025-09-21 10:15:00', exitedAt: '2025-09-22 09:45:00', qtyProcessed: 10 },
      { stage: 'After Phosphating QC', enteredAt: '2025-09-22 09:45:00', exitedAt: '2025-09-23 11:20:00', qtyProcessed: 15 },
      { stage: 'Assembly', enteredAt: '2025-09-23 11:20:00', exitedAt: '2025-09-24 13:30:00', qtyProcessed: 20 },
      { stage: 'Testing', enteredAt: '2025-09-24 13:30:00', qtyProcessed: 25 }
    ]
  },
  {
    id: '2',
    assemblyLine: 'A',
    gmsoaNo: 'SOA0776',
    soaSrNo: '5',
    assemblyDate: '20-09-2025',
    uniqueCode: 'ORD-0776-2025-5',
    splittedCode: '',
    party: 'coxBRO Engineering Pvt Ltd',
    customerPoNo: '56420',
    codeNo: '20GB8AH12T80C8H1G29',
    product: '20MM-GBV-800#-F60-BW80-T80(F60+FST6)-B8MCL2/8M-HREG-F60+GRAPHITE',
    qty: 4,
    qtyExe: 3,
    qtyPending: 1,
    finishedValve: 'yes',
    gmLogo: 'BOS',
    namePlate: 'N',
    productSpcl1: '',
    productSpcl2: 'PLUG ST.6',
    productSpcl3: 'T',
    inspection: 'N',
    painting: 'N',
    remarks: '',
    alertStatus: false,
    workflowHistory: [
      { stage: 'Planning', enteredAt: '2025-09-20 08:30:00', exitedAt: '2025-09-20 15:00:00', qtyProcessed: 0 },
      { stage: 'Material Issue', enteredAt: '2025-09-20 15:00:00', exitedAt: '2025-09-21 11:00:00', qtyProcessed: 1 },
      { stage: 'Semi QC', enteredAt: '2025-09-21 11:00:00', exitedAt: '2025-09-22 10:30:00', qtyProcessed: 1 },
      { stage: 'After Phosphating QC', enteredAt: '2025-09-22 10:30:00', exitedAt: '2025-09-23 12:00:00', qtyProcessed: 2 },
      { stage: 'Assembly', enteredAt: '2025-09-23 12:00:00', exitedAt: '2025-09-24 14:00:00', qtyProcessed: 2 },
      { stage: 'Testing', enteredAt: '2025-09-24 14:00:00', qtyProcessed: 3 }
    ]
  }
];

// SVS Data
export const svsOrders: OrderData[] = [
  {
    id: '0',
    assemblyLine: 'S',
    gmsoaNo: 'SOA0210',
    soaSrNo: '25',
    assemblyDate: '27-10-2025',
    uniqueCode: 'ORD-0210-2025-25',
    splittedCode: '',
    party: 'Independence Valve & Supply',
    customerPoNo: '1030755',
    codeNo: '32GT1D9T12C3H6P3',
    product: '32MM-GTV-150#-F316/L(SS316/L)-INTFE-T12(SS316+HST6)-B8M/8M-H304/L-PTEADIT',
    qty: 20,
    qtyExe: 8,
    qtyPending: 12,
    finishedValve: 'yes',
    gmLogo: 'PVP',
    namePlate: 'PVP',
    productSpcl1: 'એરોનું ટપકું કાઢવું.',
    productSpcl2: 'WEDGE ST.6',
    productSpcl3: '',
    inspection: 'Y',
    painting: 'N',
    remarks: '',
    alertStatus: false,
    workflowHistory: [
      { stage: 'Planning', enteredAt: '2025-10-27 09:00:00', exitedAt: '2025-10-27 15:30:00', qtyProcessed: 0 },
      { stage: 'Material Issue', enteredAt: '2025-10-27 15:30:00', exitedAt: '2025-10-28 11:00:00', qtyProcessed: 2 },
      { stage: 'Semi QC', enteredAt: '2025-10-28 11:00:00', exitedAt: '2025-10-29 10:15:00', qtyProcessed: 3 },
      { stage: 'After Phosphating QC', enteredAt: '2025-10-29 10:15:00', exitedAt: '2025-10-29 16:45:00', qtyProcessed: 4 },
      { stage: 'Assembly', enteredAt: '2025-10-29 16:45:00', exitedAt: '2025-10-30 12:30:00', qtyProcessed: 6 },
      { stage: 'Testing', enteredAt: '2025-10-30 12:30:00', exitedAt: '2025-10-30 17:00:00', qtyProcessed: 7 },
      { stage: 'SVS', enteredAt: '2025-10-30 17:00:00', qtyProcessed: 8 }
    ]
  },
  {
    id: '2',
    assemblyLine: 'A',
    gmsoaNo: 'SOA0776',
    soaSrNo: '5',
    assemblyDate: '20-09-2025',
    uniqueCode: 'ORD-0776-2025-5',
    splittedCode: '',
    party: 'coxBRO Engineering Pvt Ltd',
    customerPoNo: '56420',
    codeNo: '20GB8AH12T80C8H1G29',
    product: '20MM-GBV-800#-F60-BW80-T80(F60+FST6)-B8MCL2/8M-HREG-F60+GRAPHITE',
    qty: 4,
    qtyExe: 4,
    qtyPending: 0,
    finishedValve: 'yes',
    gmLogo: 'BOS',
    namePlate: 'N',
    productSpcl1: '',
    productSpcl2: 'PLUG ST.6',
    productSpcl3: 'T',
    inspection: 'N',
    painting: 'N',
    remarks: '',
    alertStatus: false,
    workflowHistory: [
      { stage: 'Planning', enteredAt: '2025-09-20 08:30:00', exitedAt: '2025-09-20 15:00:00', qtyProcessed: 0 },
      { stage: 'Material Issue', enteredAt: '2025-09-20 15:00:00', exitedAt: '2025-09-21 11:00:00', qtyProcessed: 1 },
      { stage: 'Semi QC', enteredAt: '2025-09-21 11:00:00', exitedAt: '2025-09-22 10:30:00', qtyProcessed: 1 },
      { stage: 'After Phosphating QC', enteredAt: '2025-09-22 10:30:00', exitedAt: '2025-09-23 12:00:00', qtyProcessed: 2 },
      { stage: 'Assembly', enteredAt: '2025-09-23 12:00:00', exitedAt: '2025-09-24 14:00:00', qtyProcessed: 2 },
      { stage: 'Testing', enteredAt: '2025-09-24 14:00:00', exitedAt: '2025-09-25 10:30:00', qtyProcessed: 3 },
      { stage: 'SVS', enteredAt: '2025-09-25 10:30:00', exitedAt: '2025-09-25 16:00:00', qtyProcessed: 4 }
    ]
  },
  {
    id: '4',
    assemblyLine: 'D',
    gmsoaNo: 'SOA0918',
    soaSrNo: '1',
    assemblyDate: 'HOLD',
    uniqueCode: 'ORD-0918-2025-1',
    splittedCode: '',
    party: 'John Crane Middle East F.Z.E.',
    customerPoNo: '4503254953',
    codeNo: 'OTB20GT9D13T12WBH2S3(0918)',
    product: 'OTB-20MM-GTV-1500#-F316/L(SS316/L)-BW160-T12(SS316+HST6)-WELDED-HBLK-FULL BORE-(0918)',
    qty: 11,
    qtyExe: 5,
    qtyPending: 6,
    finishedValve: 'yes',
    gmLogo: 'GM',
    namePlate: 'GM',
    productSpcl1: 'એરોનું ટપકું કાઢવું.',
    productSpcl2: 'NACE,IGC-E,PMI',
    productSpcl3: '',
    inspection: 'N',
    painting: 'N',
    remarks: '',
    alertStatus: false,
    workflowHistory: [
      { stage: 'Planning', enteredAt: '2025-10-20 10:30:00', exitedAt: '2025-10-21 09:00:00', qtyProcessed: 0 },
      { stage: 'Material Issue', enteredAt: '2025-10-21 09:00:00', exitedAt: '2025-10-22 11:30:00', qtyProcessed: 1 },
      { stage: 'Semi QC', enteredAt: '2025-10-22 11:30:00', exitedAt: '2025-10-23 14:00:00', qtyProcessed: 2 },
      { stage: 'After Phosphating QC', enteredAt: '2025-10-23 14:00:00', exitedAt: '2025-10-24 10:00:00', qtyProcessed: 3 },
      { stage: 'Assembly', enteredAt: '2025-10-24 10:00:00', exitedAt: '2025-10-25 13:15:00', qtyProcessed: 4 },
      { stage: 'Testing', enteredAt: '2025-10-25 13:15:00', exitedAt: '2025-10-26 16:30:00', qtyProcessed: 4 },
      { stage: 'SVS', enteredAt: '2025-10-26 16:30:00', qtyProcessed: 5 }
    ]
  }
];

// Marking Data
export const markingOrders: OrderData[] = [
  {
    id: '0',
    assemblyLine: 'S',
    gmsoaNo: 'SOA0210',
    soaSrNo: '25',
    assemblyDate: '27-10-2025',
    uniqueCode: 'ORD-0210-2025-25',
    splittedCode: '',
    party: 'Independence Valve & Supply',
    customerPoNo: '1030755',
    codeNo: '32GT1D9T12C3H6P3',
    product: '32MM-GTV-150#-F316/L(SS316/L)-INTFE-T12(SS316+HST6)-B8M/8M-H304/L-PTEADIT',
    qty: 20,
    qtyExe: 15,
    qtyPending: 5,
    finishedValve: 'yes',
    gmLogo: 'PVP',
    namePlate: 'PVP',
    productSpcl1: 'એરોનું ટપકું કાઢવું.',
    productSpcl2: 'WEDGE ST.6',
    productSpcl3: '',
    inspection: 'Y',
    painting: 'N',
    remarks: '',
    alertStatus: false,
    workflowHistory: [
      { stage: 'Planning', enteredAt: '2025-10-27 09:00:00', exitedAt: '2025-10-27 15:30:00', qtyProcessed: 0 },
      { stage: 'Material Issue', enteredAt: '2025-10-27 15:30:00', exitedAt: '2025-10-28 11:00:00', qtyProcessed: 2 },
      { stage: 'Semi QC', enteredAt: '2025-10-28 11:00:00', exitedAt: '2025-10-29 10:15:00', qtyProcessed: 3 },
      { stage: 'After Phosphating QC', enteredAt: '2025-10-29 10:15:00', exitedAt: '2025-10-29 16:45:00', qtyProcessed: 4 },
      { stage: 'Assembly', enteredAt: '2025-10-29 16:45:00', exitedAt: '2025-10-30 12:30:00', qtyProcessed: 6 },
      { stage: 'Testing', enteredAt: '2025-10-30 12:30:00', exitedAt: '2025-10-30 17:00:00', qtyProcessed: 7 },
      { stage: 'SVS', enteredAt: '2025-10-30 17:00:00', exitedAt: '2025-10-31 10:00:00', qtyProcessed: 8 },
      { stage: 'Marking', enteredAt: '2025-10-31 10:00:00', qtyProcessed: 15 }
    ]
  },
  {
    id: '2',
    assemblyLine: 'A',
    gmsoaNo: 'SOA0776',
    soaSrNo: '5',
    assemblyDate: '20-09-2025',
    uniqueCode: 'ORD-0776-2025-5',
    splittedCode: '',
    party: 'coxBRO Engineering Pvt Ltd',
    customerPoNo: '56420',
    codeNo: '20GB8AH12T80C8H1G29',
    product: '20MM-GBV-800#-F60-BW80-T80(F60+FST6)-B8MCL2/8M-HREG-F60+GRAPHITE',
    qty: 4,
    qtyExe: 4,
    qtyPending: 0,
    finishedValve: 'yes',
    gmLogo: 'BOS',
    namePlate: 'N',
    productSpcl1: '',
    productSpcl2: 'PLUG ST.6',
    productSpcl3: 'T',
    inspection: 'N',
    painting: 'N',
    remarks: '',
    alertStatus: false,
    workflowHistory: [
      { stage: 'Planning', enteredAt: '2025-09-20 08:30:00', exitedAt: '2025-09-20 15:00:00', qtyProcessed: 0 },
      { stage: 'Material Issue', enteredAt: '2025-09-20 15:00:00', exitedAt: '2025-09-21 11:00:00', qtyProcessed: 1 },
      { stage: 'Semi QC', enteredAt: '2025-09-21 11:00:00', exitedAt: '2025-09-22 10:30:00', qtyProcessed: 1 },
      { stage: 'After Phosphating QC', enteredAt: '2025-09-22 10:30:00', exitedAt: '2025-09-23 12:00:00', qtyProcessed: 2 },
      { stage: 'Assembly', enteredAt: '2025-09-23 12:00:00', exitedAt: '2025-09-24 14:00:00', qtyProcessed: 2 },
      { stage: 'Testing', enteredAt: '2025-09-24 14:00:00', exitedAt: '2025-09-25 10:30:00', qtyProcessed: 3 },
      { stage: 'SVS', enteredAt: '2025-09-25 10:30:00', exitedAt: '2025-09-25 16:00:00', qtyProcessed: 4 },
      { stage: 'Marking', enteredAt: '2025-09-25 16:00:00', exitedAt: '2025-09-26 09:30:00', qtyProcessed: 4 }
    ]
  },
  {
    id: '4',
    assemblyLine: 'D',
    gmsoaNo: 'SOA0918',
    soaSrNo: '1',
    assemblyDate: 'HOLD',
    uniqueCode: 'ORD-0918-2025-1',
    splittedCode: '',
    party: 'John Crane Middle East F.Z.E.',
    customerPoNo: '4503254953',
    codeNo: 'OTB20GT9D13T12WBH2S3(0918)',
    product: 'OTB-20MM-GTV-1500#-F316/L(SS316/L)-BW160-T12(SS316+HST6)-WELDED-HBLK-FULL BORE-(0918)',
    qty: 11,
    qtyExe: 8,
    qtyPending: 3,
    finishedValve: 'yes',
    gmLogo: 'GM',
    namePlate: 'GM',
    productSpcl1: 'એરોનું ટપકું કાઢવું.',
    productSpcl2: 'NACE,IGC-E,PMI',
    productSpcl3: '',
    inspection: 'N',
    painting: 'N',
    remarks: '',
    alertStatus: false,
    workflowHistory: [
      { stage: 'Planning', enteredAt: '2025-10-20 10:30:00', exitedAt: '2025-10-21 09:00:00', qtyProcessed: 0 },
      { stage: 'Material Issue', enteredAt: '2025-10-21 09:00:00', exitedAt: '2025-10-22 11:30:00', qtyProcessed: 1 },
      { stage: 'Semi QC', enteredAt: '2025-10-22 11:30:00', exitedAt: '2025-10-23 14:00:00', qtyProcessed: 2 },
      { stage: 'After Phosphating QC', enteredAt: '2025-10-23 14:00:00', exitedAt: '2025-10-24 10:00:00', qtyProcessed: 3 },
      { stage: 'Assembly', enteredAt: '2025-10-24 10:00:00', exitedAt: '2025-10-25 13:15:00', qtyProcessed: 4 },
      { stage: 'Testing', enteredAt: '2025-10-25 13:15:00', exitedAt: '2025-10-26 16:30:00', qtyProcessed: 4 },
      { stage: 'SVS', enteredAt: '2025-10-26 16:30:00', exitedAt: '2025-10-27 11:00:00', qtyProcessed: 5 },
      { stage: 'Marking', enteredAt: '2025-10-27 11:00:00', qtyProcessed: 8 }
    ]
  }
];
