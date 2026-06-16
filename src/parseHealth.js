const KJ_TO_KCAL = 0.239006;
const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

const WORKOUT_META = {
  '야외 걷기':         { emoji: '🚶‍♂️', color: '#3b82f6' },
  '실내 걷기':         { emoji: '🚶',    color: '#60a5fa' },
  '야외 달리기':       { emoji: '🏃‍♂️', color: '#f59e0b' },
  '슬로우 러닝':       { emoji: '🏃',    color: '#f59e0b' },
  '기능적 근력 훈련':  { emoji: '💪',    color: '#10b981' },
  '야외 운동':         { emoji: '🏋️',   color: '#8b5cf6' },
  '실내 달리기':       { emoji: '🏃',    color: '#f97316' },
};

function getMeta(name) {
  return WORKOUT_META[name] || { emoji: '⚡', color: '#6b7280' };
}

function parseKSTDate(str) {
  if (!str) return null;
  // "2026-06-15 12:17:37 +0900" → ISO 8601
  return new Date(str.replace(' ', 'T').replace(' +0900', '+09:00'));
}

function sumArray(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr.reduce((s, item) => s + (item.qty || 0), 0);
}

function getKcal(w) {
  if (w.activeEnergyBurned?.qty) return w.activeEnergyBurned.qty * KJ_TO_KCAL;
  const activeSum = sumArray(w.activeEnergy);
  if (activeSum !== null) return activeSum * KJ_TO_KCAL;
  return (w.totalEnergy?.qty ?? 0) * KJ_TO_KCAL;
}

function getDistanceKm(w) {
  if (w.distance?.qty) return w.distance.qty;
  const distSum = sumArray(w.walkingAndRunningDistance);
  return distSum ?? 0;
}

export function parseWorkouts(json) {
  const raw = json?.data?.workouts || [];
  return raw
    .map(w => {
      const start = parseKSTDate(w.start);
      const stepsSum = sumArray(w.stepCount);
      return {
        id: w.id || w.start,
        name: w.name,
        meta: getMeta(w.name),
        start,
        end: parseKSTDate(w.end),
        durationMin: Math.round((w.duration || 0) / 60),
        kcal: Math.round(getKcal(w)),
        distanceKm: Math.round(getDistanceKm(w) * 100) / 100,
        avgHR: w.avgHeartRate?.qty ? Math.round(w.avgHeartRate.qty) : null,
        maxHR: w.maxHeartRate?.qty ? Math.round(w.maxHeartRate.qty) : null,
        steps: stepsSum !== null ? Math.round(stepsSum) : null,
      };
    })
    .sort((a, b) => a.start - b.start);
}

function toLocalDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function aggregateByDay(workouts) {
  const map = {};
  workouts.forEach(w => {
    const key = toLocalDateKey(w.start);
    if (!map[key]) {
      const m = w.start.getMonth() + 1;
      const d = w.start.getDate();
      const day = DAYS[w.start.getDay()];
      map[key] = {
        key,
        label: `${m}/${d} (${day})`,
        workouts: [],
        kcal: 0,
        distanceKm: 0,
        durationMin: 0,
      };
    }
    const entry = map[key];
    entry.workouts.push(w);
    entry.kcal += w.kcal;
    entry.distanceKm += w.distanceKm;
    entry.durationMin += w.durationMin;
  });
  return Object.values(map).sort((a, b) => a.key.localeCompare(b.key));
}

export function serializeWorkouts(workouts) {
  return workouts.map(w => ({
    ...w,
    start: w.start?.toISOString() || null,
    end: w.end?.toISOString() || null,
  }));
}

export function deserializeWorkouts(data) {
  return data.map(w => ({
    ...w,
    start: w.start ? new Date(w.start) : null,
    end: w.end ? new Date(w.end) : null,
  }));
}

export function weeklyTotals(workouts) {
  const typeCount = {};
  workouts.forEach(w => {
    typeCount[w.name] = (typeCount[w.name] || 0) + 1;
  });
  return {
    sessions: workouts.length,
    kcal: Math.round(workouts.reduce((s, w) => s + w.kcal, 0)),
    distanceKm: Math.round(workouts.reduce((s, w) => s + w.distanceKm, 0) * 10) / 10,
    durationMin: Math.round(workouts.reduce((s, w) => s + w.durationMin, 0)),
    typeCount,
  };
}
