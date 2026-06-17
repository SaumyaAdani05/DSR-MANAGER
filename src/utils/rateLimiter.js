const LIMITS = {
  maxAttempts: 5,
  lockoutDurationMs: 5 * 60 * 1000, // 5 minutes
  baseDelayMs: 1000, // 1 second
};

export const checkLockout = (key) => {
  const storeKey = `rate_limit_${key}`;
  try {
    const data = JSON.parse(localStorage.getItem(storeKey)) || { attempts: 0, lockoutUntil: 0 };
    const now = Date.now();

    if (data.lockoutUntil > now) {
      return {
        locked: true,
        remainingTime: Math.ceil((data.lockoutUntil - now) / 1000),
        attempts: data.attempts,
      };
    }

    // Calculate progressive delay if attempts > 2
    let delayMs = 0;
    if (data.attempts >= 3) {
      delayMs = LIMITS.baseDelayMs * Math.pow(2, data.attempts - 3);
    }

    return { locked: false, remainingTime: 0, attempts: data.attempts, delayMs };
  } catch (e) {
    console.error('Failed to check rate limit:', e);
    return { locked: false, remainingTime: 0, attempts: 0, delayMs: 0 };
  }
};

export const recordFailure = (key) => {
  const storeKey = `rate_limit_${key}`;
  try {
    const data = JSON.parse(localStorage.getItem(storeKey)) || { attempts: 0, lockoutUntil: 0 };
    const now = Date.now();

    data.attempts += 1;
    if (data.attempts >= LIMITS.maxAttempts) {
      data.lockoutUntil = now + LIMITS.lockoutDurationMs;
    }

    localStorage.setItem(storeKey, JSON.stringify(data));
    console.warn(`Failed attempt recorded for ${key}. Total attempts: ${data.attempts}`);
    return data;
  } catch (e) {
    console.error('Failed to record rate limit failure:', e);
    return { attempts: 1, lockoutUntil: 0 };
  }
};

export const resetAttempts = (key) => {
  const storeKey = `rate_limit_${key}`;
  try {
    localStorage.removeItem(storeKey);
  } catch (e) {
    console.error('Failed to reset rate limit attempts:', e);
  }
};
