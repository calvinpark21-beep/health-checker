export default function FileUpload({ onLoad }) {
  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target.result);
        onLoad(json);
      } catch {
        alert('JSON 파일 파싱 오류. Health Auto Export에서 JSON으로 내보낸 파일인지 확인해주세요.');
      }
    };
    reader.readAsText(file);
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0d1117',
    }}>
      <div style={{ textAlign: 'center', padding: '2rem', maxWidth: 400 }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🏃‍♂️</div>
        <h1 style={{ color: '#e6edf3', fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          주간 건강 리포트
        </h1>
        <p style={{ color: '#8b949e', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.6 }}>
          Health Auto Export 앱에서 내보낸<br />JSON 파일을 업로드하세요
        </p>
        <label style={{
          display: 'inline-block',
          padding: '0.75rem 2rem',
          background: '#10b981',
          color: 'white',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '0.95rem',
          transition: 'background 0.15s',
        }}>
          파일 선택
          <input type="file" accept=".json" onChange={handleFile} style={{ display: 'none' }} />
        </label>
        <p style={{ color: '#484f58', fontSize: '0.75rem', marginTop: '1.5rem', lineHeight: 1.6 }}>
          Health Auto Export → 내보내기 → JSON 형식<br />
          기간: 1주일 기준 권장
        </p>
      </div>
    </div>
  );
}
