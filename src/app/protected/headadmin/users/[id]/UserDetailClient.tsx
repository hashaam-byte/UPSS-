"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Permission {
  id: string;
  module: string;
  actions: string[];
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

interface UserDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string | null;
  role: string;
  avatar: string | null;
  dateOfBirth: string | null;
  phone: string | null;
  address: string | null;
  gender: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin: string | null;
  loginAttempts: number;
  lockUntil: string | null;
  createdAt: string;
  updatedAt: string;
  schoolId: string | null;
  school: { id: string; name: string; slug: string } | null;
  studentProfile: Record<string, unknown> | null;
  teacherProfile: (Record<string, unknown> & {
    teacherSubjects?: Array<{
      subject: { id: string; name: string; code: string };
      classes: string[];
    }>;
  }) | null;
  adminProfile: (Record<string, unknown> & {
    permissions?: Permission[];
  }) | null;
  settings: Record<string, unknown> | null;
  _count: { sessions: number; auditLogs: number };
}

type Tab = "overview" | "edit" | "permissions" | "danger";

// ─── Role Badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    HEADADMIN: { bg: "bg-violet-100", text: "text-violet-800", label: "Head Admin" },
    ADMIN:     { bg: "bg-blue-100",   text: "text-blue-800",   label: "Admin" },
    TEACHER:   { bg: "bg-emerald-100",text: "text-emerald-800",label: "Teacher" },
    STUDENT:   { bg: "bg-amber-100",  text: "text-amber-800",  label: "Student" },
  };
  const s = map[role] ?? { bg: "bg-gray-100", text: "text-gray-700", label: role };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-green-500" : "bg-red-500"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</dt>
      <dd className="text-sm text-gray-900 font-medium">{value ?? <span className="text-gray-300 font-normal">—</span>}</dd>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ user }: { user: UserDetail }) {
  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : null;
  const fmtDt = (d: string | null) =>
    d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null;

  return (
    <div className="space-y-6">
      {/* Core user info */}
      <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Account</h3>
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5">
          <Field label="Full Name" value={`${user.firstName} ${user.lastName}`} />
          <Field label="Email" value={user.email} />
          <Field label="Username" value={user.username} />
          <Field label="Role" value={<RoleBadge role={user.role} />} />
          <Field label="Status" value={<StatusBadge active={user.isActive} />} />
          <Field label="Email Verified" value={user.isEmailVerified ? "Yes ✓" : "No ✗"} />
          <Field label="Phone" value={user.phone} />
          <Field label="Gender" value={user.gender} />
          <Field label="Date of Birth" value={fmt(user.dateOfBirth)} />
          <Field label="Address" value={user.address} />
          <Field label="School" value={user.school?.name} />
          <Field label="Last Login" value={fmtDt(user.lastLogin)} />
          <Field label="Login Attempts" value={user.loginAttempts} />
          <Field label="Locked Until" value={fmtDt(user.lockUntil)} />
          <Field label="Joined" value={fmtDt(user.createdAt)} />
        </dl>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm text-center">
          <p className="text-3xl font-bold text-gray-900">{user._count.sessions}</p>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">Active Sessions</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm text-center">
          <p className="text-3xl font-bold text-gray-900">{user._count.auditLogs}</p>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">Audit Events</p>
        </div>
      </div>

      {/* Role profile */}
      {user.role === "STUDENT" && user.studentProfile && <StudentProfileSection profile={user.studentProfile} />}
      {user.role === "TEACHER" && user.teacherProfile && <TeacherProfileSection profile={user.teacherProfile} />}
      {(user.role === "ADMIN" || user.role === "HEADADMIN") && user.adminProfile && (
        <AdminProfileSection profile={user.adminProfile} showPerms={false} />
      )}
    </div>
  );
}

function StudentProfileSection({ profile }: { profile: Record<string, unknown> }) {
  const fmt = (d: unknown) =>
    typeof d === "string" ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : null;
  const cls = profile.class as { name: string; code: string } | null;
  return (
    <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Student Profile</h3>
      <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5">
        <Field label="Student ID" value={profile.studentId as string} />
        <Field label="Class" value={cls ? `${cls.name} (${cls.code})` : (profile.className as string)} />
        <Field label="Section" value={profile.section as string} />
        <Field label="Department" value={profile.department as string} />
        <Field label="Stream" value={profile.currentStream as string} />
        <Field label="Admission" value={fmt(profile.admissionDate)} />
        <Field label="Blood Group" value={profile.bloodGroup as string} />
        <Field label="Allergies" value={profile.allergies as string} />
        <Field label="Emergency Contact" value={profile.emergencyContact as string} />
        <Field label="Parent" value={profile.parentName as string} />
        <Field label="Parent Phone" value={profile.parentPhone as string} />
        <Field label="Parent Email" value={profile.parentEmail as string} />
        <Field label="Subject Selection" value={(profile.hasCompletedSubjectSelection as boolean) ? "Complete ✓" : "Pending"} />
      </dl>
    </section>
  );
}

function TeacherProfileSection({ profile }: { profile: UserDetail["teacherProfile"] }) {
  if (!profile) return null;
  const fmt = (d: unknown) =>
    typeof d === "string" ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : null;
  const roleMap: Record<string, string> = {
    DIRECTOR: "Director", COORDINATOR: "Coordinator", SUBJECT_TEACHER: "Subject Teacher",
  };
  return (
    <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Teacher Profile</h3>
      <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5 mb-6">
        <Field label="Employee ID" value={profile.employeeId as string} />
        <Field label="Teacher Role" value={roleMap[(profile.teacherRole as string)] ?? (profile.teacherRole as string)} />
        <Field label="Department" value={profile.department as string} />
        <Field label="Qualification" value={profile.qualification as string} />
        <Field label="Experience" value={(profile.experienceYears as number) > 0 ? `${profile.experienceYears} yrs` : null} />
        <Field label="Joining Date" value={fmt(profile.joiningDate)} />
        <Field label="Coordinator Class" value={profile.coordinatorClass as string} />
        <Field label="Level Spec." value={profile.levelSpecialization as string} />
        <Field label="Can Teach Streams" value={(profile.canTeachStreams as string[])?.join(", ")} />
      </dl>
      {profile.teacherSubjects && profile.teacherSubjects.length > 0 && (
        <>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Assigned Subjects</h4>
          <div className="flex flex-wrap gap-2">
            {profile.teacherSubjects.map((ts, i) => (
              <span key={i} className="bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1 rounded-full border border-emerald-100">
                {ts.subject.name} <span className="opacity-60">({ts.subject.code})</span>
              </span>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function AdminProfileSection({
  profile,
  showPerms,
}: {
  profile: UserDetail["adminProfile"];
  showPerms: boolean;
}) {
  if (!profile) return null;
  return (
    <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Admin Profile</h3>
      <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5">
        <Field label="Employee ID" value={profile.employeeId as string} />
        <Field label="Department" value={profile.department as string} />
        <Field label="Phone" value={profile.phone as string} />
      </dl>
      {showPerms && profile.permissions && profile.permissions.length > 0 && (
        <div className="mt-6">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Permissions</h4>
          <PermissionsTable permissions={profile.permissions} readOnly />
        </div>
      )}
    </section>
  );
}

// ─── Permissions Table (reused in tab) ───────────────────────────────────────
function PermissionsTable({
  permissions,
  readOnly = false,
  onChange,
}: {
  permissions: Permission[];
  readOnly?: boolean;
  onChange?: (updated: Permission[]) => void;
}) {
  const toggle = (idx: number, field: keyof Pick<Permission, "canCreate" | "canRead" | "canUpdate" | "canDelete">) => {
    if (readOnly || !onChange) return;
    const next = permissions.map((p, i) => i === idx ? { ...p, [field]: !p[field] } : p);
    onChange(next);
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-xs text-gray-400 uppercase tracking-widest">
            <th className="text-left px-4 py-3">Module</th>
            {(["canCreate","canRead","canUpdate","canDelete"] as const).map(f => (
              <th key={f} className="px-4 py-3 text-center">{f.replace("can","")}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {permissions.map((p, i) => (
            <tr key={p.id ?? i} className="hover:bg-gray-50/50">
              <td className="px-4 py-3 font-medium text-gray-700 capitalize">{p.module}</td>
              {(["canCreate","canRead","canUpdate","canDelete"] as const).map(f => (
                <td key={f} className="px-4 py-3 text-center">
                  <button
                    type="button"
                    disabled={readOnly}
                    onClick={() => toggle(i, f)}
                    className={`w-5 h-5 rounded border transition-all ${p[f] ? "bg-blue-500 border-blue-500 text-white" : "bg-white border-gray-200 text-transparent"} ${readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
                    aria-label={`${f} for ${p.module}`}
                  >
                    ✓
                  </button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Edit Tab ─────────────────────────────────────────────────────────────────
function EditTab({ user, onSaved }: { user: UserDetail; onSaved: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    username: user.username ?? "",
    phone: user.phone ?? "",
    address: user.address ?? "",
    gender: user.gender ?? "",
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/protected/headadmin/users/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const d = await res.json();
          setError(d.error ?? "Update failed");
          return;
        }
        setSuccess(true);
        onSaved();
      } catch {
        setError("Network error");
      }
    });
  };

  const inputCls = "w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition";

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Edit User Details</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {([
          ["firstName", "First Name"],
          ["lastName",  "Last Name"],
          ["email",     "Email"],
          ["username",  "Username"],
          ["phone",     "Phone"],
          ["address",   "Address"],
        ] as [string, string][]).map(([key, label]) => (
          <div key={key}>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
            <input
              className={inputCls}
              value={form[key as keyof typeof form]}
              onChange={e => set(key, e.target.value)}
              type={key === "email" ? "email" : "text"}
            />
          </div>
        ))}

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Gender</label>
          <select className={inputCls} value={form.gender} onChange={e => set("gender", e.target.value)}>
            <option value="">— select —</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}
      {success && <p className="text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3">User updated successfully.</p>}

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

// ─── Permissions Tab ─────────────────────────────────────────────────────────
const ALL_MODULES = [
  "users","schools","classes","subjects","assignments","grades",
  "attendance","timetables","invoices","payments","resources",
  "messages","notifications","announcements","reports","settings",
];

function PermissionsTab({ user, onSaved }: { user: UserDetail; onSaved: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const initPerms = (): Permission[] => {
    const existing = user.adminProfile?.permissions ?? [];
    return ALL_MODULES.map(mod => {
      const found = existing.find(p => p.module === mod);
      return found ?? { id: "", module: mod, actions: [], canCreate: false, canRead: false, canUpdate: false, canDelete: false };
    });
  };

  const [perms, setPerms] = useState<Permission[]>(initPerms);

  if (user.role !== "ADMIN" && user.role !== "HEADADMIN") {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm text-center text-gray-400 text-sm">
        Permissions are only applicable to Admin users.
      </div>
    );
  }

  const handleSave = () => {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/protected/headadmin/users/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ permissions: perms }),
        });
        if (!res.ok) {
          const d = await res.json();
          setError(d.error ?? "Failed to save permissions");
          return;
        }
        setSuccess(true);
        onSaved();
      } catch {
        setError("Network error");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Module Permissions</h3>
        <PermissionsTable permissions={perms} onChange={setPerms} />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}
      {success && <p className="text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3">Permissions saved.</p>}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save Permissions"}
        </button>
      </div>
    </div>
  );
}

// ─── Danger Zone Tab ─────────────────────────────────────────────────────────
function DangerTab({ user, onAction }: { user: UserDetail; onAction: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const toggleActive = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/protected/headadmin/users/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !user.isActive }),
        });
        if (!res.ok) {
          const d = await res.json();
          setError(d.error ?? "Failed");
          return;
        }
        onAction();
      } catch {
        setError("Network error");
      }
    });
  };

  const hardDelete = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/protected/headadmin/users/${user.id}?hard=true`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const d = await res.json();
          setError(d.error ?? "Delete failed");
          return;
        }
        router.push("/protected/headadmin/users");
      } catch {
        setError("Network error");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Deactivate / Reactivate */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-1">
          {user.isActive ? "Deactivate User" : "Reactivate User"}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {user.isActive
            ? "The user will lose access to the platform but their data will be retained."
            : "Restoring access will allow this user to log in again."}
        </p>
        <button
          onClick={toggleActive}
          disabled={isPending}
          className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition disabled:opacity-50 ${user.isActive ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-green-600 hover:bg-green-700 text-white"}`}
        >
          {isPending ? "Processing…" : user.isActive ? "Deactivate User" : "Reactivate User"}
        </button>
      </div>

      {/* Hard delete */}
      <div className="bg-white border border-red-100 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-red-500 uppercase tracking-widest mb-1">Permanently Delete</h3>
        <p className="text-sm text-gray-500 mb-4">
          This action is <strong>irreversible</strong>. All data associated with this user, including profiles, grades, attendance, and submissions, will be deleted.
        </p>

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="px-5 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition"
          >
            Delete User
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={hardDelete}
              disabled={isPending}
              className="px-5 py-2.5 bg-red-700 text-white text-sm font-semibold rounded-xl hover:bg-red-800 transition disabled:opacity-50"
            >
              {isPending ? "Deleting…" : "Yes, permanently delete"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}
    </div>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────
export default function UserDetailClient({ initialUser }: { initialUser: UserDetail }) {
  const [user, setUser] = useState<UserDetail>(initialUser);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [refreshKey, setRefreshKey] = useState(0);

  // After mutations we re-fetch for fresh data
  const refresh = async () => {
    try {
      const res = await fetch(`/api/protected/headadmin/users/${user.id}`);
      if (res.ok) {
        const d = await res.json();
        setUser(d.user);
        setRefreshKey(k => k + 1);
      }
    } catch {/* silent */}
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview",    label: "Overview" },
    { key: "edit",        label: "Edit" },
    { key: "permissions", label: "Permissions" },
    { key: "danger",      label: "Danger Zone" },
  ];

  // Avatar initials
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50/70 font-sans">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header card */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white text-xl font-bold shrink-0 select-none">
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt="" className="w-full h-full object-cover rounded-2xl" />
            ) : initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900 truncate">{user.firstName} {user.lastName}</h1>
              <RoleBadge role={user.role} />
              <StatusBadge active={user.isActive} />
            </div>
            <p className="text-sm text-gray-400">{user.email} {user.username && <span className="text-gray-300">· @{user.username}</span>}</p>
            {user.school && <p className="text-xs text-gray-400 mt-0.5">{user.school.name}</p>}
          </div>
          <div className="text-xs text-gray-300 shrink-0 text-right hidden sm:block">
            <p>ID: {user.id.slice(0, 8)}…</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100/80 rounded-xl p-1 mb-6 w-fit">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === t.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : t.key === "danger"
                  ? "text-red-400 hover:text-red-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div key={refreshKey}>
          {activeTab === "overview"    && <OverviewTab user={user} />}
          {activeTab === "edit"        && <EditTab user={user} onSaved={refresh} />}
          {activeTab === "permissions" && <PermissionsTab user={user} onSaved={refresh} />}
          {activeTab === "danger"      && <DangerTab user={user} onAction={refresh} />}
        </div>
      </div>
    </div>
  );
}