import { useState } from 'react';

const PARTS = ['발바닥', '엉덩이', '허리', '종아리'];

function scoreColor(val) {
  if (val === '' || val == null) return '#484f58';
  const n = Number(val);
  if (n === 0) return '#10b981';
  if (n <= 3) return '#f59e0b';
  if (n <= 6) return '#f97316';
  return '#ef4444';
}

function DayPain({ day, dayData, onUpdate }) {
  const [open, setOpen] = useState(false);

  const scores = PARTS
    .map(p => dayData?.[p]?.score)
    .filter(s => s !== '' && s != null)
    .map(Number);
  const maxScore = scores.length > 0 ? Math.max(...scores) : null;

  return (
    <div style={{ borderBottom: '1px solid #21262d' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.6rem 0',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#e6edf3' }}>
          {day.label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {maxScore != null ? (
            <span style={{ fontSize: '0.72rem', color: scoreColor(maxScore) }}>
              최대 {maxScore}점
            </span>
          ) : (
            <span style={{ fontSize: '0.72rem', color: '#484f58' }}>미입력</span>
          )}
          <span style={{ color: '#8b949e', fontSize: '0.7rem' }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div style={{ paddingBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {PARTS.map(part => {
            const score = dayData?.[part]?.score ?? '';
            const comment = dayData?.[part]?.comment ?? '';
            return (
              <div key={part} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: 44, fontSize: '0.75rem', color: '#8b949e', flexShrink: 0 }}>
                  {part}
                </span>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={score}
                  onChange={e => {
                    const raw = e.target.value;
                    const val = raw === '' ? '' : Math.min(10, Math.max(0, Number(raw)));
                    onUpdate(part, 'score', val);
                  }}
                  style={{
                    width: 52,
                    padding: '0.25rem',
                    background: '#21262d',
                    border: `1px solid ${scoreColor(score)}55`,
                    borderRadius: '0.25rem',
                    color: scoreColor(score),
                    fontSize: '0.8rem',
                    textAlign: 'center',
                    outline: 'none',
                    flexShrink: 0,
                  }}
                  placeholder="0-10"
                />
                <input
                  type="text"
                  value={comment}
                  onChange={e => onUpdate(part, 'comment', e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.25rem 0.5rem',
                    background: '#21262d',
                    border: '1px solid #30363d',
                    borderRadius: '0.25rem',
                    color: '#e6edf3',
                    fontSize: '0.75rem',
                    outline: 'none',
                  }}
                  placeholder="메모 (선택)"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PainInput({ byDay, painData, onChange }) {
  function update(dateKey, part, field, value) {
    onChange(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        [part]: {
          ...(prev[dateKey]?.[part] || {}),
          [field]: value,
        },
      },
    }));
  }

  return (
    <div style={{
      background: '#161b22',
      border: '1px solid #30363d',
      borderRadius: '0.5rem',
      padding: '1rem',
      marginBottom: '1rem',
    }}>
      <h2 style={{ color: '#e6edf3', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.5rem' }}>
        🩹 통증 기록
        <span style={{ fontSize: '0.72rem', color: '#8b949e', fontWeight: '400', marginLeft: '0.5rem' }}>
          날짜 클릭 → 부위별 0~10점 + 메모
        </span>
      </h2>
      <div style={{ fontSize: '0.72rem', color: '#484f58', marginBottom: '0.625rem' }}>
        <span style={{ color: '#10b981' }}>● 0</span> 없음 &nbsp;
        <span style={{ color: '#f59e0b' }}>● 1-3</span> 약함 &nbsp;
        <span style={{ color: '#f97316' }}>● 4-6</span> 보통 &nbsp;
        <span style={{ color: '#ef4444' }}>● 7-10</span> 심함
      </div>
      {[...byDay].reverse().map(day => (
        <DayPain
          key={day.key}
          day={day}
          dayData={painData[day.key]}
          onUpdate={(part, field, value) => update(day.key, part, field, value)}
        />
      ))}
    </div>
  );
}
