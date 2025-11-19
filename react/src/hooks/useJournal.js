// Use from any component: import { useJournal } from "./useJournal.js";
import { buildUrl } from '../config/api';

// Helper function to remove empty, null, or undefined fields from payload
const cleanPayload = (payload) => {
  const cleaned = {};
  Object.keys(payload).forEach(key => {
    const value = payload[key];
    // Only include non-empty values (excluding empty strings, null, undefined)
    if (value !== '' && value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  });
  return cleaned;
};

// Helper function for API requests to reduce boilerplate
const apiRequest = async (endpoint, options = {}) => {
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    const config = {
        headers: { ...defaultHeaders, ...options.headers },
        ...options
    };

    const response = await fetch(buildUrl(endpoint), config);

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    // Handle empty responses (like DELETE operations that return 204 No Content)
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');

    // If response is empty or has no content, return null instead of trying to parse JSON
    if (response.status === 204 || contentLength === '0' || !contentType?.includes('application/json')) {
        return null;
    }

    // Check if response has content before trying to parse JSON
    const text = await response.text();
    if (!text || text.trim() === '') {
        return null;
    }

    try {
        return JSON.parse(text);
    } catch (error) {
        console.warn('Failed to parse JSON response:', text);
        return null;
    }
};

// Helper function to create journal entry line payload
const createJournalLinePayload = (line) => ({
    jeid: line.jeid,
    account: line.accountId,
    debit: line.debit,
    credit: line.credit,
    memo: line.memo,
    inactive: false,
    recordID: line.recordID,
    recordType: line.recordType
});

// Helper function to handle journal line creation
const createJournalLine = async (line) => {
    return await apiRequest('/journal-entry-line', {
        method: 'POST',
        body: JSON.stringify(cleanPayload(createJournalLinePayload(line)))
    });
};

// Helper function to handle bulk journal line creation
const createJournalLinesBulk = async (lines) => {
    const payload = {
        lines: lines.map(line => cleanPayload(createJournalLinePayload(line)))
    };

    return await apiRequest('/journal-entry-line', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
};

// Helper function to handle bulk journal line deletion
const deleteJournalLinesBulk = async (lines) => {
    const ids = lines
        .map(line => line.id)
        .filter(id => id && id !== '' && id !== null);

    if (ids.length === 0) {
        console.warn('No valid IDs found for bulk delete');
        return { deleted: true, count: 0 };
    }

    const payload = {
        ids: ids
    };

    await apiRequest('/journal-entry-line', {
        method: 'DELETE',
        body: JSON.stringify(payload)
    });

    return { deleted: true, count: ids.length, ids: ids };
};

// Helper function to handle bulk journal line update
const updateJournalLinesBulk = async (lines) => {
    // Filter lines that have IDs (existing records to update)
    const linesToUpdate = lines.filter(line => line.id && line.id !== '' && line.id !== null);

    // Filter lines without IDs (new records to create)
    const linesToCreate = lines.filter(line => !line.id || line.id === '' || line.id === null);

    // If we have lines to update, send bulk PUT request
    if (linesToUpdate.length > 0) {
        const payload = {
            lines: linesToUpdate.map(line => ({
                id: line.id,
                ...cleanPayload(createJournalLinePayload(line))
            }))
        };

        await apiRequest('/journal-entry-line', {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
    }

    // If we have lines without IDs, create them using bulk create
    if (linesToCreate.length > 0) {
        console.log(`Creating ${linesToCreate.length} new journal lines (no IDs provided)`);
        await createJournalLinesBulk(linesToCreate);
    }

    return {
        updated: linesToUpdate.length,
        created: linesToCreate.length,
        total: lines.length
    };
};

// Helper function to handle journal line update
const updateJournalLine = async (line) => {
    // If line.id is empty, null, or undefined, create new record instead
    if (!line.id || line.id === '' || line.id === null) {
        console.log(`Creating new journal line (no ID provided)`);
        return await createJournalLine(line);
    }

    try {
        // Update existing record
        return await apiRequest(`/journal-entry-line/${line.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                ...createJournalLinePayload(line)
            })
        });
    } catch (error) {
        // If record doesn't exist (404 or other error), create new one
        if (error.message.includes('404')) {
            console.log(`Journal line ${line.id} not found, creating new record`);
            return await createJournalLine(line);
        }
        throw error;
    }
};

// Helper function to handle journal line deletion
const deleteJournalLine = async (line) => {
    if (!line.id || line.id === '' || line.id === null) {
        throw new Error('Line ID is required for delete operation');
    }

    await apiRequest(`/journal-entry-line/${line.id}`, { method: 'DELETE' });
    return { deleted: true, id: line.id };
};

// Helper function to fetch multiple account running balances in bulk
const fetchAccountRunningBalancesBulk = async (accountIds) => {
    try {
        if (!accountIds || accountIds.length === 0) {
            return {};
        }

        const payload = {
            ids: accountIds
        };

        const balances = await apiRequest('/chart-of-account/balances', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        // Convert array response to a map for easy lookup
        // { accountId: runningBalance }
        const balanceMap = {};
        if (Array.isArray(balances)) {
            balances.forEach(item => {
                // Use runningBalance if available, otherwise use openingBalance
                const runningBalance = item.runningBalance ?? item.openingBalance ?? 0;
                balanceMap[item.id] = Number(runningBalance);
            });
        }

        console.log(`✅ Fetched ${Object.keys(balanceMap).length} account balances in bulk`);
        return balanceMap;
    } catch (error) {
        console.error('Error fetching running balances in bulk:', error);
        // Return empty object on error - individual accounts will default to 0
        return {};
    }
};

// Helper function to update multiple account running balances in bulk
const updateAccountRunningBalancesBulk = async (accountUpdates) => {
    try {
        if (!accountUpdates || accountUpdates.length === 0) {
            return;
        }

        const payload = {
            accounts: accountUpdates.map(update => ({
                id: update.accountId,
                runningBalance: update.newRunningBalance
            }))
        };

        await apiRequest('/chart-of-account/bulk', {
            method: 'PUT',
            body: JSON.stringify(payload)
        });

        console.log(`✅ Updated ${accountUpdates.length} account running balances in bulk`);
    } catch (error) {
        console.error('Error updating running balances in bulk:', error);
        throw error;
    }
};

export async function processJournal(changes, type, recordID, recordType) {
    console.log('=== Start Processing JV Lines ===');
    console.log('changes', changes);
    console.log('type', type);
    console.log('recordID', recordID);
    console.log('recordType', recordType);
    const accounts = {};
    const lines = [];

    // Fetch running balances for all accounts in bulk
    const uniqueAccountIds = [...new Set(changes.map(ch => String(ch.accountId)).filter(id => id && id !== 'undefined' && id !== 'null'))];

    console.log('uniqueAccountIds', uniqueAccountIds);
    console.log('all accountIds from changes:', changes.map(ch => ({ accountId: ch.accountId, stringified: String(ch.accountId) })));

    // Use bulk fetch instead of individual fetches
    const balanceMap = await fetchAccountRunningBalancesBulk(uniqueAccountIds);

    // Populate accounts object with fetched balances
    for (const accountId of uniqueAccountIds) {
        accounts[accountId] = {
            running: balanceMap[accountId] ?? 0, // Default to 0 if not found
            netDelta: 0
        };
    }

    console.log('accounts', accounts);

    for (const ch of changes) {
        const acct = String(ch.accountId);

        // Ensure the account exists in our accounts object
        if (!accounts[acct]) {
            console.warn(`Account ${acct} not found in accounts object, initializing with 0 balance...`);
            accounts[acct] = {
                running: 0, // Default to 0 if not fetched in bulk (shouldn't happen normally)
                netDelta: 0
            };
        }

        const oldNet = (ch.oldCredit || 0) - (ch.oldDebit || 0);
        const newNet = (ch.newCredit || 0) - (ch.newDebit || 0);
        const delta = newNet - oldNet;
        accounts[acct].netDelta += delta;
    }

    console.log('accounts after netDelta', accounts);

    // Build lines array
    for (const ch of changes) {
        const acct = String(ch.accountId);

        const line = {
            jeid: ch.jeid || null,
            id: ch.id || null,
            accountId: acct,
            memo: ch.memo,
            credit: Number(ch.newCredit || 0),
            debit: Number(ch.newDebit || 0)
        };

        // Only add recordID and recordType if they have valid values
        if (recordID && recordID !== '' && recordID !== null) {
            line.recordID = recordID;
        }
        if (recordType && recordType !== '' && recordType !== null) {
            line.recordType = recordType;
        }

        lines.push(line);
    }

    console.log("lines---------",lines)
    // Handle journal-entry-line API operations based on type
    if (type && lines.length > 0) {
        try {
            switch (type.toLowerCase()) {
                case 'new':
                    // Use bulk creation for new journal lines
                    await createJournalLinesBulk(lines);
                    break;

                case 'edit':
                    // Use bulk update for journal lines
                    await updateJournalLinesBulk(lines);
                    break;

                case 'delete':
                    // Use bulk deletion for journal lines
                    await deleteJournalLinesBulk(lines);
                    break;

                default:
                    console.warn(`Unknown operation type: ${type}`);
            }
        } catch (error) {
            console.error(`Error processing journal lines:`, error);
            throw error;
        }
    }

    // Prepare bulk account updates
    const accountUpdates = [];
    for (const acct in accounts) {
        const a = accounts[acct];
        const newRunning = a.running + a.netDelta;
        console.log(`Account ${acct}: running=${a.running}, netDelta=${a.netDelta}, newRunning=${newRunning}`);
        accountUpdates.push({
            accountId: acct,
            newRunningBalance: newRunning
        });
    }

    // Update all account running balances in a single bulk operation
    if (accountUpdates.length > 0) {
        await updateAccountRunningBalancesBulk(accountUpdates);
    }
}