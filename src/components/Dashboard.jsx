import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AIAnalysis from './AIAnalysis';
import PainInput from './PainInput';

const WORKOUT_COLORS = {
  '야외 걷기':         '#3b82f6',
  '실내 걷기':         '#60a5fa',
  '야외 달리기':       '#f59e0b',
  '슬로우 러닝':       '#f59e0b',
  '기능적 근력 훈련':  '#10b981',
  '야외 운동':         '#8b5cf6',
  '실내 달리기':       '#f97316',
};

function getColor(name) {
  return WORKOUT_COLORS[name] || '#6b7280';
}

function WorkoutCard({ workout: w }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.625rem 0.875rem',
      background: '#21262d',
      borderRadius: '0.375rem',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: getColor(w.name) + '22',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1rem', flexShrink: 0,
      }}>
        {w.meta.emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#e6edf3', fontWeight: '600', fontSize: '0.8rem' }}>{w.name}</div>
        <div style={{ color: '#8b949e', fontSize: '0.72rem' }}>
          {w.start.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
          {w.avgHR ? ` · 평균 ${w.avgHR}bpm` : ''}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0, fontSize: '0.8rem' }}>
        <div style={{ color: '#e6edf3' }}>{w.durationMin}분</div>
        <div style={{ color: '#10b981' }}>{w.kcal} kcal</div>
      </div>
      {w.distanceKm > 0 && (
        <div style={{ color: '#8b949e', fontSize: '0.75rem', flexShrink: 0, minWidth: 36, textAlign: 'right' }}>
          {w.distanceKm}km
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div style={{
      background: '#161b22',
      border: '1px solid #30363d',
      borderRadius: '0.5rem',
      padding: '1rem',
    }}>
      <div style={{ fontSize: '1.25rem', marginBottom: '0.375rem' }}>{icon}</div>
      <div style={{ color: '#e6edf3', fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.125rem' }}>{value}</div>
      <div style={{ color: '#8b949e', fontSize: '0.72rem' }}>{label}</div>
    </div>
  );
}

const TooltipStyle = {
  contentStyle: {
    background: '#21262d',
    border: '1px solid #30363d',
    borderRadius: '0.375rem',
    color: '#e6edf3',
    fontSize: '0.8rem',
  },
  cursor: { fill: 'rgba(255,255,255,0.04)' },
};

export default function Dashboard({ data, onReset }) {
  const { workouts, byDay, totals } = data;
  const [painData, setPainData] = useState(() => {
    try { return JSON.parse(localStorage.getItem('health_pain_data') || '{}'); }
    catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem('health_pain_data', JSON.stringify(painData));
  }, [painData]);

  const h = Math.floor(totals.durationMin / 60);
  const m = totals.durationMin % 60;

  const start = workouts[0].start;
  const end = workouts[workouts.length - 1].start;
  const dateRange = `${start.getMonth()+1}/${start.getDate()} ~ ${end.getMonth()+1}/${end.getDate()}`;

  const savedAt = data.savedAt
    ? new Date(data.savedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  const chartData = byDay.map(d => ({
    name: d.label,
    kcal: Math.round(d.kcal),
  }));

  return (
    <div style={{
      maxWidth: 800,
      margin: '0 auto',
      padding: '1.5rem 1rem',
      minHeight: '100vh',
      background: '#0d1117',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ color: '#e6edf3', fontSize: '1.2rem', fontWeight: '700' }}>🏃‍♂️ 주간 건강 리포트</h1>
          <p style={{ color: '#8b949e', fontSize: '0.8rem', marginTop: 2 }}>
            {dateRange} · {totals.sessions}회 운동
            {savedAt && <span style={{ color: '#484f58', marginLeft: '0.5rem' }}>· {savedAt} 업로드</span>}
          </p>
        </div>
        <button
          onClick={onReset}
          style={{
            padding: '0.4rem 0.875rem',
            background: 'transparent',
            border: '1px solid #30363d',
            color: '#8b949e',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.8rem',
          }}
        >
          새 파일
        </button>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '0.625rem',
        marginBottom: '1rem',
      }}>
        <StatCard icon="🗓" label="운동 세션" value={`${totals.sessions}회`} />
        <StatCard icon="🔥" label="소비 칼로리" value={`${totals.kcal.toLocaleString()} kcal`} />
        <StatCard icon="📍" label="이동 거리" value={`${totals.distanceKm} km`} />
        <StatCard icon="⏱" label="운동 시간" value={h > 0 ? `${h}h ${m}m` : `${m}분`} />
      </div>

      {/* Daily Chart */}
      <div style={{
        background: '#161b22',
        border: '1px solid #30363d',
        borderRadius: '0.5rem',
        padding: '1rem',
        marginBottom: '1rem',
      }}>
        <h2 style={{ color: '#e6edf3', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.875rem' }}>
          일별 소비 칼로리
        </h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} barSize={28} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              {...TooltipStyle}
              formatter={(v) => [`${v.toLocaleString()} kcal`, '칼로리']}
            />
            <Bar dataKey="kcal" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Workout Type Breakdown */}
      <div style={{
        background: '#161b22',
        border: '1px solid #30363d',
        borderRadius: '0.5rem',
        padding: '1rem',
        marginBottom: '1rem',
      }}>
        <h2 style={{ color: '#e6edf3', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.75rem' }}>
          운동 종류
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {Object.entries(totals.typeCount).map(([name, count]) => (
            <div key={name} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#21262d',
              borderRadius: '999px',
              padding: '0.25rem 0.75rem',
              fontSize: '0.78rem',
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: getColor(name), flexShrink: 0 }} />
              <span style={{ color: '#e6edf3' }}>{name}</span>
              <span style={{ color: '#8b949e' }}>{count}회</span>
            </div>
          ))}
        </div>
      </div>

      {/* Workout List grouped by day */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ color: '#e6edf3', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.75rem' }}>
          운동 내역
        </h2>
        {[...byDay].reverse().map(day => (
          <div key={day.key} style={{ marginBottom: '0.875rem' }}>
            <div style={{
              color: '#8b949e',
              fontSize: '0.75rem',
              fontWeight: '600',
              marginBottom: '0.375rem',
              display: 'flex',
              gap: '0.5rem',
            }}>
              <span>{day.label}</span>
              <span>·</span>
              <span>{day.workouts.length}회</span>
              <span>·</span>
              <span style={{ color: '#10b981' }}>{Math.round(day.kcal)} kcal</span>
              {day.distanceKm > 0 && <><span>·</span><span>{Math.round(day.distanceKm * 10) / 10} km</span></>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {[...day.workouts].reverse().map(w => (
                <WorkoutCard key={w.id} workout={w} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Pain Input */}
      <PainInput byDay={byDay} painData={painData} onChange={setPainData} />

      {/* AI Analysis */}
      <AIAnalysis data={data} painData={painData} />
    </div>
  );
}
