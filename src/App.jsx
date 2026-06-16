import { useState } from 'react';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import {
  parseWorkouts, aggregateByDay, weeklyTotals,
  serializeWorkouts, deserializeWorkouts,
} from './parseHealth';

const CACHE_KEY = 'health_data_v1';

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { workouts: serialized, savedAt } = JSON.parse(raw);
    const workouts = deserializeWorkouts(serialized);
    const byDay = aggregateByDay(workouts);
    const totals = weeklyTotals(workouts);
    return { workouts, byDay, totals, savedAt };
  } catch {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
}

function saveCache(workouts) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    workouts: serializeWorkouts(workouts),
    savedAt: new Date().toISOString(),
  }));
}

export default function App() {
  const [data, setData] = useState(() => loadCache());

  function handleFile(json) {
    const workouts = parseWorkouts(json);
    if (!workouts.length) {
      alert('운동 데이터가 없습니다. Health Auto Export JSON 파일인지 확인해주세요.');
      return;
    }
    saveCache(workouts);
    // 새 데이터 업로드 시 통증 기록 초기화
    localStorage.removeItem('health_pain_data');
    const byDay = aggregateByDay(workouts);
    const totals = weeklyTotals(workouts);
    setData({ workouts, byDay, totals, savedAt: new Date().toISOString() });
  }

  function handleReset() {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem('health_pain_data');
    setData(null);
  }

  if (!data) return <FileUpload onLoad={handleFile} />;
  return <Dashboard data={data} onReset={handleReset} />;
}
