import { useState } from 'react';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import { parseWorkouts, aggregateByDay, weeklyTotals } from './parseHealth';

export default function App() {
  const [data, setData] = useState(null);

  function handleFile(json) {
    const workouts = parseWorkouts(json);
    if (!workouts.length) {
      alert('운동 데이터가 없습니다. Health Auto Export JSON 파일인지 확인해주세요.');
      return;
    }
    const byDay = aggregateByDay(workouts);
    const totals = weeklyTotals(workouts);
    setData({ workouts, byDay, totals });
  }

  if (!data) return <FileUpload onLoad={handleFile} />;
  return <Dashboard data={data} onReset={() => setData(null)} />;
}
