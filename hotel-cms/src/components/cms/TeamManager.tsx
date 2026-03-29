"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import InviteUserModal from "./InviteUserModal";

interface TeamUser {
  id: string;
  email: string;
  name: string;
  role: string;
  hotelAccess: string[];
  lastLoginAt: string | null;
  createdAt: string;
}

interface Hotel {
  id: string;
  name: string;
}

interface TeamManagerProps {
  users: TeamUser[];
  hotels: Hotel[];
  currentUserId: string;
}

const roleBadge: Record<string, string> = {
  admin: "bg-[#e85d45] text-white",
  editor: "bg-[#7c5cbf] text-white",
  viewer: "bg-[#3b7dd8] text-white",
};

const avatarGradients = [
  { from: "#e85d45", to: "#d49a12" },
  { from: "#7c5cbf", to: "#3b7dd8" },
  { from: "#0fa886", to: "#3b7dd8" },
  { from: "#d49a12", to: "#e85d45" },
  { from: "#3b7dd8", to: "#7c5cbf" },
];

function relativeTime(isoDate: string | null): string {
  if (!isoDate) return "Never";
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}yr ago`;
}

// ─── User Card ────────────────────────────────────────────────────────────────

interface UserCardProps {
  user: TeamUser;
  hotels: Hotel[];
  isSelf: boolean;
  index: number;
}

function UserCard({ user, hotels, isSelf, index }: UserCardProps) {
  const router = useRouter();
  const grad = avatarGradients[index % avatarGradients.length];

  const [editingRole, setEditingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user.role);
  const [savingRole, setSavingRole] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const hotelLabel =
    user.role === "admin"
      ? "All hotels"
      : user.hotelAccess.length === 0
        ? "No hotels"
        : `${user.hotelAccess.length} hotel${user.hotelAccess.length !== 1 ? "s" : ""}`;

  async function saveRole() {
    if (selectedRole === user.role) {
      setEditingRole(false);
      return;
    }
    setSavingRole(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to update role");
      }
      setEditingRole(false);
      router.refresh();
    } catch (err) {
      console.error("[UserCard saveRole]", err);
    } finally {
      setSavingRole(false);
    }
  }

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Delete failed");
      }
      router.refresh();
    } catch (err) {
      console.error("[UserCard handleDelete]", err);
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <div className={`glass-card-static rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 border border-border bg-card/60 backdrop-blur-sm animate-in animate-in-delay-${Math.min(index + 1, 5)}`}>
      {/* Avatar */}
      <div
        className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-base font-bold text-white"
        style={{
          background: `linear-gradient(135deg, ${grad.from}, ${grad.to})`,
          boxShadow: `0 2px 8px ${grad.from}4d`,
        }}
      >
        {user.name.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center flex-wrap gap-2">
          <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
          {isSelf && (
            <span className="text-xs text-muted bg-elevated rounded-full px-2 py-0.5">
              you
            </span>
          )}
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${roleBadge[user.role] ?? "bg-[#7c7893] text-white"}`}
          >
            {user.role}
          </span>
        </div>
        <p className="text-xs text-muted truncate">{user.email}</p>
        <div className="flex items-center gap-3 text-xs text-muted">
          <span>{hotelLabel}</span>
          <span className="text-border">·</span>
          <span>Last login: {relativeTime(user.lastLoginAt)}</span>
        </div>
      </div>

      {/* Actions */}
      {!isSelf && (
        <div className="flex items-center gap-2 shrink-0">
          {/* Edit role */}
          {editingRole ? (
            <div className="flex items-center gap-1.5">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                disabled={savingRole}
                className="text-xs px-2 py-1.5 rounded-lg border border-border bg-elevated text-foreground focus:border-[#7c5cbf] focus:outline-none transition-colors disabled:opacity-50"
              >
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              <button
                type="button"
                onClick={saveRole}
                disabled={savingRole}
                className="p-1.5 rounded-lg text-[#0fa886] hover:bg-[#0fa886]/10 transition-colors disabled:opacity-40"
                title="Save"
              >
                {savingRole ? (
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                onClick={() => { setEditingRole(false); setSelectedRole(user.role); }}
                disabled={savingRole}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-elevated transition-colors disabled:opacity-40"
                title="Cancel"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditingRole(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-foreground hover:bg-elevated transition-colors"
              title="Edit role"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Edit role
            </button>
          )}

          {/* Delete */}
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            title={confirming ? "Click again to confirm deletion" : "Remove user"}
            className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              confirming
                ? "bg-[#e85d45]/20 text-[#e85d45] hover:bg-[#e85d45]/30"
                : "text-muted hover:text-[#e85d45] hover:bg-[#e85d45]/10"
            }`}
          >
            {deleting ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── TeamManager ──────────────────────────────────────────────────────────────

export default function TeamManager({ users, hotels, currentUserId }: TeamManagerProps) {
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between animate-in">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Team</h2>
          <p className="text-sm text-muted mt-0.5">
            {users.length} {users.length === 1 ? "member" : "members"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors shadow-lg shadow-[#e85d45]/20"
          style={{ background: "linear-gradient(135deg, #e85d45, #d49a12)" }}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
          </svg>
          Invite User
        </button>
      </div>

      {/* User list */}
      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 glass-card-static rounded-xl text-center">
          <div className="w-16 h-16 rounded-full bg-elevated flex items-center justify-center mb-4">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8 text-muted">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">No team members</h3>
          <p className="text-sm text-muted mb-4">
            Invite your first team member to get started
          </p>
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium shadow-lg shadow-[#e85d45]/20"
            style={{ background: "linear-gradient(135deg, #e85d45, #d49a12)" }}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
            </svg>
            Invite User
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user, index) => (
            <UserCard
              key={user.id}
              user={user}
              hotels={hotels}
              isSelf={user.id === currentUserId}
              index={index}
            />
          ))}
        </div>
      )}

      {/* Invite modal */}
      {inviteOpen && (
        <InviteUserModal hotels={hotels} onClose={() => setInviteOpen(false)} />
      )}
    </div>
  );
}
