
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'db.json');

export interface DepositRecord {
    txHash: string;
    chainKey: number;
    status: 'PENDING' | 'ProofGenerated' | 'Synced' | 'Error';
    proof?: any;
    createdAt: number;
}

export const getDb = (): { deposits: DepositRecord[] } => {
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify({ deposits: [] }, null, 2));
    }
    try {
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return { deposits: [] };
    }
};

export const saveDeposit = (record: DepositRecord) => {
    const db = getDb();
    const index = db.deposits.findIndex(d => d.txHash === record.txHash);
    if (index >= 0) {
        db.deposits[index] = { ...db.deposits[index], ...record };
    } else {
        db.deposits.push(record);
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
};

export const getDeposit = (txHash: string): DepositRecord | undefined => {
    const db = getDb();
    return db.deposits.find(d => d.txHash === txHash);
};
