export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--elevated), var(--background))" }}>
      {children}
    </div>
  );
}
