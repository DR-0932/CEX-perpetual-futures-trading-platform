export class BalanceStore {
    balance = new Map();
    locked = new Map();
    getLocked(userId) {
        let m = this.locked.get(userId);
        if (!m) {
            m = new Map();
            this.locked.set(userId, m);
        }
        return m;
    }
    getBalance(userId) {
        let m = this.balance.get(userId);
        if (!m) {
            m = new Map;
            this.balance.set(userId, m);
        }
        return m;
    }
    //moving reserved money from lock to balance(available money)
    unlock(userId, asset, amount) {
        const currentLocked = this.locked.get(userId);
        const currentBalance = this.balance.get(userId);
        const currentLockedAmount = currentLocked?.get(asset) || 0;
        if (currentLockedAmount < amount) {
            throw new Error("locked balance is less than amount to unlock");
        }
        currentLocked?.set(asset, currentLockedAmount - amount);
        currentBalance?.set(asset, (currentBalance.get(asset) || 0) + amount);
    }
    lock(userId, asset, amount) {
        const currentBalance = this.balance.get(userId);
        let currentLocked = this.locked.get(userId);
        const currentBalanceAmount = currentBalance?.get(asset) || 0;
        if (currentBalanceAmount < amount) {
            throw new Error("balance is less than amount to lock");
        }
        if (!currentLocked) {
            this.locked.set(userId, new Map());
            currentLocked = this.locked.get(userId);
        }
        currentLocked?.set(asset, (currentLocked.get(asset) || 0) + amount);
        currentBalance?.set(asset, currentBalanceAmount - amount);
    }
    deductLocked(userId, asset, amount) {
        const m = this.locked.get(userId);
        const currentLockedAmount = m?.get(asset) || 0;
        if (currentLockedAmount < amount) {
            throw new Error("locked balance is less than amount to deduct");
        }
        m?.set(asset, currentLockedAmount - amount);
    }
    credit(userId, asset, amount) {
        let m = this.balance.get(userId);
        if (!m) {
            this.balance.set(userId, new Map());
            m = this.balance.get(userId);
        }
        const currentBalanceAmount = m?.get(asset) || 0;
        m?.set(asset, currentBalanceAmount + amount);
    }
    getUserBalance(userId) {
        let b1 = this.balance.get(userId);
        let l1 = this.locked.get(userId);
        if (!b1) {
            b1 = new Map();
            this.balance.set(userId, b1);
        }
        if (!l1) {
            l1 = new Map();
            this.locked.set(userId, l1);
        }
        const ans = {
            balance: Object.fromEntries(b1),
            locked: Object.fromEntries(l1),
        };
        return ans;
    }
    getUserBalanceOnly(userId) {
        let m = this.balance.get(userId);
        if (!m) {
            m = new Map();
            this.balance.set(userId, m);
        }
        return Object.fromEntries(m);
    }
    getUserLockedOnly(userId) {
        let m = this.locked.get(userId);
        if (!m) {
            m = new Map();
            this.locked.set(userId, m);
        }
        return Object.fromEntries(m);
    }
    // Serialize all balances to a plain JSON-safe object for snapshotting.
    serialize() {
        const res = {};
        for (const [userId, balMap] of this.balance) {
            res[userId] = {
                balance: Object.fromEntries(balMap),
                locked: Object.fromEntries(this.locked.get(userId) ?? new Map()),
            };
        }
        return res;
    }
    // Rebuild all balance Maps from a snapshot object.
    restoreFromSnapshot(data) {
        this.balance.clear();
        this.locked.clear();
        for (const [userId, { balance, locked }] of Object.entries(data)) {
            this.balance.set(userId, new Map(Object.entries(balance).map(([a, v]) => [a, Number(v)])));
            this.locked.set(userId, new Map(Object.entries(locked).map(([a, v]) => [a, Number(v)])));
        }
    }
    walSetBalance(userId, asset, available, locked) {
        let bal = this.balance.get(userId);
        if (!bal) {
            bal = new Map();
            this.balance.set(userId, bal);
        }
        bal.set(asset, available);
        let lck = this.locked.get(userId);
        if (!lck) {
            lck = new Map();
            this.locked.set(userId, lck);
        }
    }
}
export const balanceStore = new BalanceStore();
