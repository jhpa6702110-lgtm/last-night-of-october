import React from 'react';

export default function Cinema() {
  return (
    <div className="fade-in" style={{ 
      width: '100%', 
      height: 'calc(100vh - 120px)', 
      minHeight: '600px',
      borderRadius: '16px', 
      overflow: 'hidden', 
      border: '1px solid rgba(255, 255, 255, 0.08)',
      background: '#070b19',
      boxShadow: 'var(--shadow-glow)',
      marginBottom: '20px'
    }}>
      <iframe 
        src="/movie/index.html" 
        title="톱니바꿈의 영화 정보" 
        style={{ 
          width: '100%', 
          height: '100%', 
          border: 'none',
          background: 'transparent'
        }}
      />
    </div>
  );
}
