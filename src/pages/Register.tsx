import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <form
        className="w-full max-w-md border rounded-lg bg-card p-6 space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);
          setSubmitting(true);
          try {
            await register(username, email, password);
            navigate("/", { replace: true });
          } catch (err) {
            setError(err instanceof Error ? err.message : "Registration failed");
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <h1 className="text-xl font-semibold">Create account</h1>
        <div className="space-y-2">
          <label className="text-sm block">Username</label>
          <input className="w-full border rounded-md px-3 py-2 bg-background" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm block">Email</label>
          <input type="email" className="w-full border rounded-md px-3 py-2 bg-background" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm block">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full border rounded-md px-3 py-2 pr-10 bg-background"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <button className="w-full rounded-md bg-primary text-primary-foreground py-2 disabled:opacity-60" disabled={submitting}>
          {submitting ? "Creating..." : "Create account"}
        </button>
        <p className="text-sm text-muted-foreground">
          Already have an account? <Link className="underline" to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
