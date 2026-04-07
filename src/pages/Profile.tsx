import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";

export default function Profile() {
  const { user, updateProfile, changePassword } = useAuth();
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Profile</h2>
          <p className="text-sm text-muted-foreground">Update your account details and password.</p>
        </div>

        <form
          className="border rounded-lg bg-card p-4 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setMessage(null);
            setError(null);
            setSavingProfile(true);
            try {
              await updateProfile({ username, email });
              setMessage("Profile updated.");
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to update profile");
            } finally {
              setSavingProfile(false);
            }
          }}
        >
          <h3 className="font-medium">Account Info</h3>
          <div className="space-y-2">
            <label className="text-sm block">Username</label>
            <input className="w-full border rounded-md px-3 py-2 bg-background" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <label className="text-sm block">Email</label>
            <input type="email" className="w-full border rounded-md px-3 py-2 bg-background" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button className="rounded-md bg-primary text-primary-foreground px-4 py-2 disabled:opacity-60" disabled={savingProfile}>
            {savingProfile ? "Saving..." : "Save profile"}
          </button>
        </form>

        <form
          className="border rounded-lg bg-card p-4 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setMessage(null);
            setError(null);
            setSavingPassword(true);
            try {
              await changePassword(currentPassword, newPassword);
              setCurrentPassword("");
              setNewPassword("");
              setMessage("Password updated.");
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to update password");
            } finally {
              setSavingPassword(false);
            }
          }}
        >
          <h3 className="font-medium">Password</h3>
          <div className="space-y-2">
            <label className="text-sm block">Current password</label>
            <input type="password" className="w-full border rounded-md px-3 py-2 bg-background" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <label className="text-sm block">New password</label>
            <input type="password" className="w-full border rounded-md px-3 py-2 bg-background" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} required />
          </div>
          <button className="rounded-md bg-primary text-primary-foreground px-4 py-2 disabled:opacity-60" disabled={savingPassword}>
            {savingPassword ? "Updating..." : "Update password"}
          </button>
        </form>

        {message ? <p className="text-sm text-green-600">{message}</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </DashboardLayout>
  );
}
