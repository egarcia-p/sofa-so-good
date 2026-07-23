// src/components/Toast.jsx
export default function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`toast toast-${toast.type}`} role="alert" aria-live="polite">
      {toast.message}
    </div>
  );
}
