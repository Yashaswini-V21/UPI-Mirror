/**
 * localCoach.ts
 * ─────────────
 * 100% Client-Side offline financial coach engine.
 * Implements CSV statement parsing, linear regression broke-date forecasting,
 * and rule-based coaching narrative templates directly in the browser.
 */

export interface LocalTransaction {
  datetime: Date;
  amount: number;
  category: string;
  merchant: string;
}

export interface LocalCoachResult {
  status: 'stable' | 'watch' | 'critical';
  days_left: number;
  narrative: string;
  action: string;
  tip: string;
  suggested_cap: number;
  nudge: string;
  signals: {
    anomaly_detected: boolean;
    habit_score: number;
    days_left: number;
    regret_flag: boolean;
    top_category: string;
    burn_rate_daily: number;
    confidence_score: number;
  };
}

export function parseCSVLocally(csvText: string): LocalTransaction[] {
  const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  if (lines.length < 2) return [];

  // Parse header
  const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
  
  // Find column indexes
  const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('time') || h.includes('timestamp'));
  const amountIdx = headers.findIndex(h => h.includes('amount') || h.includes('spent') || h.includes('value') || h.includes('debit'));
  const merchantIdx = headers.findIndex(h => h.includes('merchant') || h.includes('payee') || h.includes('desc') || h.includes('detail'));
  const categoryIdx = headers.findIndex(h => h.includes('category') || h.includes('cat'));

  if (dateIdx === -1 || amountIdx === -1) {
    throw new Error("CSV must contain at least 'date' and 'amount' columns.");
  }

  const transactions: LocalTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map(cell => cell.trim());
    if (row.length < headers.length) continue;

    const dateVal = new Date(row[dateIdx]);
    const amountVal = parseFloat(row[amountIdx]);
    
    if (isNaN(dateVal.getTime()) || isNaN(amountVal)) continue;

    const merchantVal = merchantIdx !== -1 ? row[merchantIdx] : 'Unknown';
    let categoryVal = categoryIdx !== -1 ? row[categoryIdx] : '';

    if (!categoryVal) {
      // Simple client-side categorization mapping rules
      const m = merchantVal.toLowerCase();
      if (m.includes('swiggy') || m.includes('zomato') || m.includes('rest') || m.includes('food') || m.includes('eat')) {
        categoryVal = 'Food Delivery';
      } else if (m.includes('uber') || m.includes('ola') || m.includes('transit') || m.includes('auto') || m.includes('cab')) {
        categoryVal = 'Micro-Transit';
      } else if (m.includes('netflix') || m.includes('spotify') || m.includes('prime') || m.includes('sub')) {
        categoryVal = 'Subscriptions';
      } else if (m.includes('coffee') || m.includes('starbucks') || m.includes('cafe') || m.includes('chai')) {
        categoryVal = 'Cafes';
      } else {
        categoryVal = 'Essentials';
      }
    }

    transactions.push({
      datetime: dateVal,
      amount: amountVal,
      category: categoryVal,
      merchant: merchantVal
    });
  }

  return transactions.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());
}

export function runLocalCoach(transactions: LocalTransaction[], monthlyBudget: number): LocalCoachResult {
  if (transactions.length === 0) {
    throw new Error("No transactions available for local analysis.");
  }

  // 1. Calculate general stats
  const totalSpend = transactions.reduce((sum, t) => sum + t.amount, 0);
  const categories = Array.from(new Set(transactions.map(t => t.category)));
  
  // Calculate category spend map
  const catMap: Record<string, number> = {};
  transactions.forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + t.amount;
  });

  // Find top category
  let topCategory = 'Essentials';
  let maxCatSpend = 0;
  Object.entries(catMap).forEach(([cat, spend]) => {
    if (spend > maxCatSpend) {
      maxCatSpend = spend;
      topCategory = cat;
    }
  });

  // Get date range
  const minDate = transactions[0].datetime;
  const maxDate = transactions[transactions.length - 1].datetime;
  const rangeDays = Math.max(1, Math.round((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));
  
  const dailyBurn = totalSpend / rangeDays;
  const daysLeft = Math.max(0, Math.round(monthlyBudget / dailyBurn));

  // 2. Perform simple linear regression on cumulative spend (broke-date forecast)
  // cumulative spend over time (day index vs cumulative spend)
  const uniqueDaysMap: Record<string, number> = {};
  transactions.forEach(t => {
    const dayKey = t.datetime.toISOString().split('T')[0];
    uniqueDaysMap[dayKey] = (uniqueDaysMap[dayKey] || 0) + t.amount;
  });

  const sortedDayKeys = Object.keys(uniqueDaysMap).sort();
  let cumSum = 0;
  const regressionData = sortedDayKeys.map((key, idx) => {
    cumSum += uniqueDaysMap[key];
    return { x: idx, y: cumSum };
  });

  // Simple least squares regression: y = mx + c
  const n = regressionData.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  regressionData.forEach(p => {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
  });

  const slope = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) : dailyBurn;
  
  // Predict when cumulative spend crosses monthlyBudget
  // monthlyBudget = slope * dayIndex + c
  // dayIndex = (monthlyBudget - c) / slope
  const intercept = n > 1 ? (sumY - slope * sumX) / n : 0;
  const predictedDaycross = slope > 0 ? (monthlyBudget - intercept) / slope : 30;
  const projectedDaysLeft = Math.max(0, Math.round(predictedDaycross - n));

  // 3. Heuristics for status and alerts
  let status: 'stable' | 'watch' | 'critical' = 'stable';
  if (projectedDaysLeft < 10) {
    status = 'critical';
  } else if (projectedDaysLeft < 20) {
    status = 'watch';
  }

  // Anomaly check (is top category spend more than 40% of budget?)
  const isAnomaly = maxCatSpend > monthlyBudget * 0.4;
  const habitScore = Math.min(100, Math.round((maxCatSpend / totalSpend) * 100));

  // Local rule-bound coaching templates
  const statusToTip: Record<string, string> = {
    critical: `Cut this discretionary spending immediately. Pause all non-essential buys for 48 hours to preserve runway.`,
    watch: `Pace your transactions in ${topCategory}. Try to restrict shopping and delivery to weekdays.`,
    stable: `Your cash runway is in healthy parameters. Continue to stick to your daily caps.`
  };

  const statusToAction: Record<string, string> = {
    critical: `Reduce ${topCategory} spending by 40% to extend cash runway by ${Math.round(projectedDaysLeft * 0.5) + 3} days.`,
    watch: `Restrict weekend ${topCategory} limit to recover ₹1,800.`,
    stable: `Maintain current daily cap of ₹${Math.round(dailyBurn)} to stay within monthly budget.`
  };

  const narrativeTemplates: Record<string, string> = {
    critical: `[Local Sandbox] Warning: Spending in ${topCategory} has spiked to ₹${Math.round(maxCatSpend)} representing ${(maxCatSpend/totalSpend * 100).toFixed(0)}% of your total outflows. Cash runway linear projection indicates depletion in ${projectedDaysLeft} days. Action is required.`,
    watch: `[Local Sandbox] Alert: Discretionary leak detected in ${topCategory}. You are currently burning ₹${Math.round(dailyBurn)} daily. At this rate, your cash runway is estimated at ${projectedDaysLeft} days.`,
    stable: `[Local Sandbox] Status Stable: Your spending habits are aligned. Cash runway remains healthy with a projected ${projectedDaysLeft} days remaining.`
  };

  const suggestedCap = Math.round((monthlyBudget - (totalSpend - maxCatSpend)) / Math.max(1, 30 - rangeDays));

  return {
    status,
    days_left: projectedDaysLeft,
    narrative: narrativeTemplates[status],
    action: statusToAction[status],
    tip: statusToTip[status],
    suggested_cap: Math.max(500, suggestedCap),
    nudge: `[Offline Local Alert] Limit ${topCategory} spending to extend runway by days!`,
    signals: {
      anomaly_detected: isAnomaly,
      habit_score: habitScore,
      days_left: projectedDaysLeft,
      regret_flag: status !== 'stable',
      top_category: topCategory,
      burn_rate_daily: Math.round(dailyBurn),
      confidence_score: 0.90
    }
  };
}
