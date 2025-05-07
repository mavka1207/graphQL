// Calculate total XP from transactions
export function validateAndCalculateXP(transactions = []) {
    return transactions.reduce((sum, t) => {
        const value = typeof t.amount === 'number' ? t.amount : parseInt(t.amount, 10) || 0;
        return sum + value;
    }, 0);
}

// Format XP value with appropriate unit (K or M)
export function formatXP(xp) {
    if (xp >= 1_000_000) {
        return (xp / 1_000_000).toFixed(1) + 'M';
    } else if (xp >= 1_000) {
        return (xp / 1_000).toFixed(1) + 'K';
    } else {
        return xp.toString();
    }
}

export function calculateCompletedProjects(progresses = []) {
    return progresses.filter(p => p.grade > 0).length;
}

export function calculateAuditRatio(totalUp, totalDown) {
    if (!totalDown) return '0.000';
    return (totalUp / totalDown).toFixed(3);
}

export function calculateAuditActivityRatio(totalUp, totalDown, avgNumAuditors = 4.93, avgGroupSize = 2.36) {
    if (!totalDown) return '0.00';
    return ((totalUp / avgNumAuditors) / (totalDown / avgGroupSize)).toFixed(2);
}
