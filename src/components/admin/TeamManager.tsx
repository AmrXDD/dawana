"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { Panel } from "@/components/admin/Shell";
import { Field, Input, TextField } from "@/components/ui/Field";
import {
  createTeamMember,
  deleteTeamMember,
  listTeam,
  resetTeamPassword,
  updateTeamMember,
} from "@/lib/actions/team";
import { PASSWORD_MIN, ROLE_IDS, ROLES, USERNAME_PATTERN, type Role } from "@/lib/auth/roles";
import { cn, initials } from "@/lib/utils";
import type { AdminAccount } from "@/lib/types";

/* Unambiguous characters only — no 0/O or 1/l/I to misread when sharing. */
const ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generatePassword() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]);
  return `${chars.slice(0, 4).join("")}-${chars.slice(4, 8).join("")}-${chars.slice(8).join("")}`;
}

function suggestUsername(fullName: string) {
  return fullName
    .normalize("NFKD")
    .replace(/[^\w\s.-]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part, i) => (i === 0 ? part.toLowerCase() : part[0].toUpperCase() + part.slice(1).toLowerCase()))
    .join("")
    .slice(0, 32);
}

const ROLE_TONE: Record<Role, string> = {
  developer: "bg-mint/15 text-mint",
  admin: "bg-signal-good/12 text-signal-good",
  editor: "bg-white/8 text-mint-200/80",
};

type Dialog =
  | { kind: "create" }
  | { kind: "edit"; member: AdminAccount }
  | { kind: "password"; member: AdminAccount }
  | { kind: "share"; username: string; password: string; name: string }
  | null;

export default function TeamManager({
  initialMembers,
  currentId,
  currentRole,
}: {
  initialMembers: AdminAccount[];
  currentId: string;
  currentRole: Role;
}) {
  const [rawMembers, setMembers] = useState(initialMembers);
  // Highest access first, then in the order people were added.
  const members = [...rawMembers].sort(
    (a, b) => ROLE_IDS.indexOf(a.role) - ROLE_IDS.indexOf(b.role) || a.created_at.localeCompare(b.created_at),
  );
  const [dialog, setDialog] = useState<Dialog>(null);

  const refresh = useCallback(async () => {
    const result = await listTeam();
    if (result.ok) setMembers(result.data);
  }, []);

  useEffect(() => {
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDialog(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog]);

  /** Developer accounts are only editable by developers (server enforces it too). */
  const mayManage = (m: AdminAccount) =>
    m.id === currentId || m.role !== "developer" || currentRole === "developer";

  async function toggleActive(m: AdminAccount) {
    const next = !m.is_active;
    setMembers((prev) => prev.map((r) => (r.id === m.id ? { ...r, is_active: next } : r)));
    const result = await updateTeamMember(m.id, { isActive: next });
    if (!result.ok) {
      setMembers((prev) => prev.map((r) => (r.id === m.id ? m : r)));
      toast.error(result.error);
    } else {
      toast.success(next ? `${m.username} can sign in again.` : `${m.username} is switched off.`);
    }
  }

  async function remove(m: AdminAccount) {
    if (!confirm(`Remove ${m.full_name || m.username}? They won't be able to sign in any more.`)) {
      return;
    }
    const snapshot = members;
    setMembers((prev) => prev.filter((r) => r.id !== m.id));
    const result = await deleteTeamMember(m.id);
    if (!result.ok) {
      setMembers(snapshot);
      toast.error(result.error);
    } else {
      toast.success(`${m.username} removed.`);
    }
  }

  const active = members.filter((m) => m.is_active).length;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="u-eyebrow text-mint-300/50">
          {members.length} {members.length === 1 ? "person" : "people"} · {active} active
        </p>
        <Button variant="mint" onClick={() => setDialog({ kind: "create" })}>
          <UserPlus className="size-4" aria-hidden="true" />
          Add a person
        </Button>
      </div>

      <Panel className="overflow-hidden">
        <ul className="-my-2 divide-y divide-[color:var(--color-night-line)]">
          {members.map((m) => {
            const self = m.id === currentId;
            const locked = m.locked_until && new Date(m.locked_until) > new Date();
            const manage = mayManage(m);

            return (
              <li key={m.id} className="flex flex-col gap-4 py-4 md:flex-row md:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3.5">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-full text-[0.75rem] font-semibold",
                      m.is_active ? "bg-mint/15 text-mint" : "bg-white/5 text-mint-300/40",
                    )}
                  >
                    {initials(m.full_name || m.username)}
                  </span>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-[0.95rem] text-mint-50">
                      <span className="truncate">{m.full_name || m.username}</span>
                      {self && (
                        <span className="rounded-capsule bg-white/8 px-2 py-0.5 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-mint-200/70">
                          You
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[0.74rem] text-mint-300/50">
                      @{m.username}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:w-[15rem]">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-capsule px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-[0.14em]",
                      ROLE_TONE[m.role],
                    )}
                  >
                    {m.role !== "editor" && <ShieldCheck className="size-3" aria-hidden="true" />}
                    {ROLES[m.role].label}
                  </span>
                  <span
                    className={cn(
                      "rounded-capsule px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-[0.14em]",
                      !m.is_active
                        ? "bg-white/5 text-mint-300/45"
                        : locked
                          ? "bg-signal-warn/12 text-signal-warn"
                          : "bg-signal-good/10 text-signal-good",
                    )}
                  >
                    {!m.is_active ? "Switched off" : locked ? "Paused" : "Active"}
                  </span>
                </div>

                <p className="text-[0.78rem] text-mint-300/45 md:w-40">
                  {m.last_login_at
                    ? `Signed in ${formatDistanceToNow(new Date(m.last_login_at), { addSuffix: true })}`
                    : "Never signed in"}
                </p>

                <div className="flex items-center gap-1 md:w-[10.5rem] md:justify-end">
                  {!self && manage && (
                    <label
                      className="mr-2 inline-flex cursor-pointer items-center gap-2 text-[0.74rem] text-mint-200/60"
                      title={m.is_active ? "Switch off sign-in" : "Allow sign-in"}
                    >
                      <span className="sr-only">Can sign in</span>
                      <input
                        type="checkbox"
                        role="switch"
                        checked={m.is_active}
                        onChange={() => toggleActive(m)}
                        className="peer sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className="relative h-5 w-9 rounded-full bg-white/10 transition-colors peer-checked:bg-mint/70 peer-focus-visible:ring-2 peer-focus-visible:ring-mint/40 after:absolute after:left-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-mint-50 after:transition-transform peer-checked:after:translate-x-4"
                      />
                    </label>
                  )}
                  {manage && (
                    <>
                      <IconButton label={`Edit ${m.username}`} onClick={() => setDialog({ kind: "edit", member: m })}>
                        <Pencil className="size-4" />
                      </IconButton>
                      <IconButton
                        label={self ? "Change my password" : `Reset ${m.username}'s password`}
                        onClick={() => setDialog({ kind: "password", member: m })}
                      >
                        <KeyRound className="size-4" />
                      </IconButton>
                    </>
                  )}
                  {!self && manage && (
                    <IconButton label={`Remove ${m.username}`} tone="bad" onClick={() => remove(m)}>
                      <Trash2 className="size-4" />
                    </IconButton>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>

      {/* What each role means, in plain words */}
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {ROLE_IDS.map((id) => (
          <div
            key={id}
            className="rounded-card border border-[color:var(--color-night-line)] bg-night-raised/30 p-5"
          >
            <p className="font-display text-[1rem] font-semibold text-mint-50">{ROLES[id].label}</p>
            <p className="mt-2 text-[0.82rem] leading-relaxed text-mint-200/55">{ROLES[id].description}</p>
          </div>
        ))}
      </div>

      {dialog?.kind === "create" && (
        <CreateDialog
          currentRole={currentRole}
          onClose={() => setDialog(null)}
          onCreated={async (share) => {
            setDialog({ kind: "share", ...share });
            await refresh();
          }}
        />
      )}

      {dialog?.kind === "edit" && (
        <EditDialog
          member={dialog.member}
          self={dialog.member.id === currentId}
          currentRole={currentRole}
          onClose={() => setDialog(null)}
          onSaved={async () => {
            setDialog(null);
            await refresh();
          }}
        />
      )}

      {dialog?.kind === "password" && (
        <PasswordDialog
          member={dialog.member}
          self={dialog.member.id === currentId}
          onClose={() => setDialog(null)}
          onSaved={(password) => {
            const { member } = dialog;
            if (member.id === currentId) {
              toast.success("Your password is updated.");
              setDialog(null);
              return;
            }
            setDialog({
              kind: "share",
              username: member.username,
              password,
              name: member.full_name || member.username,
            });
          }}
        />
      )}

      {dialog?.kind === "share" && (
        <ShareDialog {...dialog} onClose={() => setDialog(null)} />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */

function IconButton({
  label,
  onClick,
  tone,
  children,
}: {
  label: string;
  onClick: () => void;
  tone?: "bad";
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-8 place-items-center rounded-tight text-mint-300/50 transition-colors",
        tone === "bad"
          ? "hover:bg-signal-bad/12 hover:text-signal-bad"
          : "hover:bg-white/6 hover:text-mint",
      )}
    >
      {children}
    </button>
  );
}

function Modal({
  title,
  description,
  onClose,
  onSubmit,
  children,
  footer,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  onSubmit?: (e: FormEvent) => void;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.(e);
        }}
        className="relative max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-card border border-[color:var(--color-night-line)] bg-night p-6"
      >
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-[1.15rem] font-semibold text-mint-50">{title}</h2>
            {description && (
              <p className="mt-1.5 text-[0.82rem] leading-relaxed text-mint-200/55">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 shrink-0 place-items-center rounded-tight text-mint-300/60 transition-colors hover:bg-white/6"
          >
            <X className="size-5" />
          </button>
        </header>
        <div className="flex flex-col gap-4">{children}</div>
        <div className="mt-7 flex gap-3">{footer}</div>
      </form>
    </div>
  );
}

function CancelButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className="border-[color:var(--color-night-line)] text-mint-100 hover:bg-white/6"
    >
      Cancel
    </Button>
  );
}

function PasswordInput({
  value,
  onChange,
  label = "Password",
  hint,
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  hint?: string;
}) {
  const [reveal, setReveal] = useState(true);

  return (
    <Field label={label} hint={hint ?? `At least ${PASSWORD_MIN} characters. Use Generate for a strong one.`} required>
      {(id, describedBy) => (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id={id}
              aria-describedby={describedBy}
              type={reveal ? "text" : "password"}
              autoComplete="new-password"
              spellCheck={false}
              required
              minLength={PASSWORD_MIN}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="pr-11 font-mono"
            />
            <button
              type="button"
              onClick={() => setReveal((v) => !v)}
              aria-label={reveal ? "Hide password" : "Show password"}
              className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-tight text-mint-300/50 transition-colors hover:bg-white/6 hover:text-mint"
            >
              {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onChange(generatePassword());
              setReveal(true);
            }}
            className="h-auto shrink-0 border-[color:var(--color-night-line)] px-3.5 text-mint-100 hover:bg-white/6"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            Generate
          </Button>
        </div>
      )}
    </Field>
  );
}

function RolePicker({
  value,
  onChange,
  currentRole,
  disabled,
}: {
  value: Role;
  onChange: (role: Role) => void;
  currentRole: Role;
  disabled?: boolean;
}) {
  return (
    <fieldset disabled={disabled} className="flex flex-col gap-2 disabled:opacity-60">
      <legend className="mb-1.5 text-[0.78rem] font-medium text-mint-200/80">What can they do?</legend>
      {ROLE_IDS.map((id) => {
        const locked = id === "developer" && currentRole !== "developer";
        const selected = value === id;
        return (
          <label
            key={id}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-tight border px-4 py-3 transition-colors",
              selected
                ? "border-mint/60 bg-mint/10"
                : "border-[color:var(--color-night-line)] hover:border-mint/30",
              locked && "cursor-not-allowed opacity-40",
            )}
          >
            <input
              type="radio"
              name="role"
              value={id}
              checked={selected}
              disabled={locked}
              onChange={() => onChange(id)}
              className="sr-only"
            />
            <span
              aria-hidden="true"
              className={cn(
                "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border",
                selected ? "border-mint bg-mint text-mint-950" : "border-mint-300/40",
              )}
            >
              {selected && <Check className="size-3" strokeWidth={3} />}
            </span>
            <span>
              <span className="block text-[0.9rem] text-mint-50">{ROLES[id].label}</span>
              <span className="mt-0.5 block text-[0.76rem] leading-snug text-mint-200/50">
                {locked ? "Only a developer can give this role." : ROLES[id].description}
              </span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

function CreateDialog({
  currentRole,
  onClose,
  onCreated,
}: {
  currentRole: Role;
  onClose: () => void;
  onCreated: (share: { username: string; password: string; name: string }) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [touchedUsername, setTouchedUsername] = useState(false);
  const [password, setPassword] = useState(() => generatePassword());
  const [role, setRole] = useState<Role>("editor");
  const [saving, setSaving] = useState(false);

  const usernameValue = touchedUsername ? username : suggestUsername(fullName);
  const usernameError =
    usernameValue && !USERNAME_PATTERN.test(usernameValue)
      ? "3–32 characters: letters, numbers, dots, dashes or underscores. No spaces."
      : undefined;

  async function submit() {
    if (usernameError || !usernameValue) {
      toast.error(usernameError ?? "Choose a username.");
      return;
    }
    setSaving(true);
    const result = await createTeamMember({ username: usernameValue, fullName, password, role });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`${usernameValue} can now sign in.`);
    onCreated({ username: usernameValue, password, name: fullName || usernameValue });
  }

  return (
    <Modal
      title="Add a person"
      description="They'll sign in at /admin with the username and password below."
      onClose={onClose}
      onSubmit={submit}
      footer={
        <>
          <Button type="submit" variant="mint" loading={saving} className="flex-1">
            Create account
          </Button>
          <CancelButton onClick={onClose} />
        </>
      }
    >
      <TextField
        label="Full name"
        placeholder="e.g. Sara Al-Mutairi"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        autoFocus
      />
      <TextField
        label="Username"
        required
        hint="What they type to sign in. Not case-sensitive."
        error={usernameError}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        value={usernameValue}
        onChange={(e) => {
          setTouchedUsername(true);
          setUsername(e.target.value.replace(/\s/g, ""));
        }}
        className="[&_input]:font-mono"
      />
      <PasswordInput value={password} onChange={setPassword} />
      <RolePicker value={role} onChange={setRole} currentRole={currentRole} />
    </Modal>
  );
}

function EditDialog({
  member,
  self,
  currentRole,
  onClose,
  onSaved,
}: {
  member: AdminAccount;
  self: boolean;
  currentRole: Role;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [fullName, setFullName] = useState(member.full_name ?? "");
  const [role, setRole] = useState<Role>(member.role);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const result = await updateTeamMember(member.id, {
      fullName,
      ...(self ? {} : { role }),
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Changes saved.");
    onSaved();
  }

  return (
    <Modal
      title={`Edit @${member.username}`}
      description={self ? "You can change your display name. Someone else has to change your role." : undefined}
      onClose={onClose}
      onSubmit={submit}
      footer={
        <>
          <Button type="submit" variant="mint" loading={saving} className="flex-1">
            Save changes
          </Button>
          <CancelButton onClick={onClose} />
        </>
      }
    >
      <TextField label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus />
      <RolePicker value={role} onChange={setRole} currentRole={currentRole} disabled={self} />
    </Modal>
  );
}

function PasswordDialog({
  member,
  self,
  onClose,
  onSaved,
}: {
  member: AdminAccount;
  self: boolean;
  onClose: () => void;
  onSaved: (password: string) => void;
}) {
  const [password, setPassword] = useState(() => (self ? "" : generatePassword()));
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const result = await resetTeamPassword(member.id, password);
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onSaved(password);
  }

  return (
    <Modal
      title={self ? "Change my password" : `New password for @${member.username}`}
      description={
        self
          ? "Other devices you're signed in on will be signed out."
          : "Their current password stops working straight away, and they're signed out everywhere."
      }
      onClose={onClose}
      onSubmit={submit}
      footer={
        <>
          <Button type="submit" variant="mint" loading={saving} className="flex-1">
            {self ? "Update password" : "Set new password"}
          </Button>
          <CancelButton onClick={onClose} />
        </>
      }
    >
      <PasswordInput value={password} onChange={setPassword} label="New password" />
    </Modal>
  );
}

function ShareDialog({
  username,
  password,
  name,
  onClose,
}: {
  username: string;
  password: string;
  name: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const text = `Dawana control room\n${window.location.origin}/admin\nUsername: ${username}\nPassword: ${password}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("Couldn't copy — select the details and copy them manually.");
    }
  }

  return (
    <Modal
      title={`Share with ${name}`}
      description="Send these sign-in details privately. For their safety the password isn't shown again after you close this."
      onClose={onClose}
      onSubmit={onClose}
      footer={
        <>
          <Button type="button" variant="mint" onClick={copy} className="flex-1">
            {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
            {copied ? "Copied" : "Copy details"}
          </Button>
          <Button
            type="submit"
            variant="outline"
            className="border-[color:var(--color-night-line)] text-mint-100 hover:bg-white/6"
          >
            Done
          </Button>
        </>
      }
    >
      <dl className="grid gap-3 rounded-tight border border-[color:var(--color-night-line)] bg-night-raised/60 p-5 font-mono text-[0.9rem]">
        {[
          ["Sign in at", "/admin"],
          ["Username", username],
          ["Password", password],
        ].map(([k, v]) => (
          <div key={k} className="flex flex-wrap items-baseline justify-between gap-2">
            <dt className="text-[0.66rem] uppercase tracking-[0.16em] text-mint-300/45">{k}</dt>
            <dd className="select-all text-mint-50">{v}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}
