// src/components/LoadingScreen.jsx
export default function LoadingScreen() {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1.5rem',
      background: 'var(--color-bg-primary)',
      minHeight: '100dvh',
    }}>
      <div style={{ fontSize: '3.5rem', animation: 'pulse 2s ease infinite' }}>🛋️</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800 }}
        className="gradient-text">
        Sofa So Good
      </div>
      <div className="spinner" />
      <style>{`@keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }`}</style>
    </div>
  );
}
