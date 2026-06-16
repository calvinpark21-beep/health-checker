import { useState } from 'react';

const PARTS = ['발바닥', '엉덩이', '허리', '종아리'];

function buildPainSection(painData, byDay) {
  const lines = [...byDay]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map(day => {
      const dayPain = painData[day.key];
      if (!dayPain) return null;
      const partLines = PARTS
        .filter(p => dayPain[p]?.score !== '' && dayPain[p]?.score != null)
        .map(p => {
          const { score, comment } = dayPain[p];
          return `    ${p}: ${score}점${comment ? ` (${comment})` : ''}`;
        });
      if (!partLines.length) return null;
      return `  ${day.label}:\n${partLines.join('\n')}`;
    })
    .filter(Boolean);

  if (!lines.length) return '';
  return `\n\n## 신체 통증 기록 (0=없음 ~ 10=극심)\n${lines.join('\n')}`;
}

function buildPrompt(data, painData) {
  const { byDay, totals } = data;
  const h = Math.floor(totals.durationMin / 60);
  const m = totals.durationMin % 60;

  const dayLines = byDay.map(d => {
    const items = d.workouts
      .map(w => {
        const dist = w.distanceKm > 0 ? `, ${w.distanceKm}km` : '';
        const hr = w.avgHR ? `, 심박${w.avgHR}bpm` : '';
        return `${w.name}(${w.durationMin}분, ${w.kcal}kcal${dist}${hr})`;
      })
      .join(' / ');
    return `  ${d.label}: ${items}`;
  }).join('\n');

  const typeLines = Object.entries(totals.typeCount)
    .map(([k, v]) => `  ${k}: ${v}회`)
    .join('\n');

  const painSection = buildPainSection(painData, byDay);
  const hasPain = painSection.length > 0;

  const painAnalysisRequest = hasPain ? `
**통증-운동 상관관계 🔍**
(통증 부위와 운동 패턴의 연관성, 원인 추정)

**통증 관련 주의사항 ⚠️**
• (즉시 주의해야 할 사항)
• (운동 조절이 필요한 부분)
` : '';

  return `당신은 운동과 재활을 전문으로 하는 헬스 코치입니다. 다음 데이터를 분석하여 한국어로 건강 리포트를 작성해주세요.

## 주간 운동 요약
- 총 운동: ${totals.sessions}회
- 소비 칼로리: ${totals.kcal.toLocaleString()} kcal
- 이동 거리: ${totals.distanceKm} km
- 총 운동 시간: ${h}시간 ${m}분

## 일별 활동
${dayLines}

## 운동 종류
${typeLines}${painSection}

---
아래 형식으로 리포트를 작성해주세요:

**이번 주 운동 총평**
(운동 패턴, 강도, 일관성 평가 — 3~4문장)

**잘한 점 ✅**
• (구체적인 칭찬 1)
• (구체적인 칭찬 2)
• (구체적인 칭찬 3)
${painAnalysisRequest}
**개선 포인트**
• (구체적인 개선점 1)
• (구체적인 개선점 2)

**다음 주 권고사항 🎯**
• (실행 가능한 조언 1)
• (실행 가능한 조언 2)
• (실행 가능한 조언 3)`;
}

export default function AIAnalysis({ data, painData }) {
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(
    import.meta.env.VITE_ANTHROPIC_API_KEY ||
    localStorage.getItem('health_api_key') || ''
  );

  function handleKeyChange(e) {
    const key = e.target.value;
    setApiKey(key);
    if (key) localStorage.setItem('health_api_key', key);
    else localStorage.removeItem('health_api_key');
  }

  const hasPainData = Object.keys(painData).some(dateKey =>
    PARTS.some(p => painData[dateKey]?.[p]?.score !== '' && painData[dateKey]?.[p]?.score != null)
  );

  async function generate() {
    const key = apiKey.trim();
    if (!key) {
      alert('Anthropic API 키를 입력해주세요');
      return;
    }
    setLoading(true);
    setReport('');
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1500,
          messages: [{ role: 'user', content: buildPrompt(data, painData) }],
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || `HTTP ${res.status}`);
      setReport(json.content[0].text);
    } catch (err) {
      setReport(`❌ 오류: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      background: '#161b22',
      border: '1px solid #30363d',
      borderRadius: '0.5rem',
      padding: '1.25rem',
    }}>
      <h2 style={{ color: '#e6edf3', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
        🤖 AI 건강 분석
      </h2>
      <p style={{ color: '#484f58', fontSize: '0.72rem', marginBottom: '0.875rem' }}>
        {hasPainData
          ? '✅ 통증 데이터 포함 — 운동+통증 상관관계를 함께 분석합니다'
          : '통증 기록을 입력하면 더 정밀한 분석이 가능합니다'}
      </p>

      {!import.meta.env.VITE_ANTHROPIC_API_KEY && (
        <input
          type="password"
          placeholder="Anthropic API Key (sk-ant-...)"
          value={apiKey}
          onChange={handleKeyChange}
          style={{
            width: '100%',
            padding: '0.5rem 0.75rem',
            marginBottom: '0.75rem',
            background: '#21262d',
            border: '1px solid #30363d',
            borderRadius: '0.375rem',
            color: '#e6edf3',
            fontSize: '0.875rem',
            outline: 'none',
          }}
        />
      )}

      <button
        onClick={generate}
        disabled={loading}
        style={{
          width: '100%',
          padding: '0.625rem',
          background: loading ? '#21262d' : '#10b981',
          color: loading ? '#8b949e' : 'white',
          border: 'none',
          borderRadius: '0.375rem',
          cursor: loading ? 'default' : 'pointer',
          fontWeight: '600',
          fontSize: '0.875rem',
        }}
      >
        {loading ? '분석 중...' : '주간 건강 리포트 생성'}
      </button>

      {report && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          background: '#0d1117',
          borderRadius: '0.375rem',
          color: '#e6edf3',
          fontSize: '0.875rem',
          lineHeight: 1.7,
          whiteSpace: 'pre-wrap',
        }}>
          {report}
        </div>
      )}
    </div>
  );
}
