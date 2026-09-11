"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Pencil, Trash2, Shield } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button, Badge, Input, Modal } from "@/components/ui";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useAdmins, useCreateAdmin, useUpdateAdmin, useDeleteAdmin } from "@/hooks/useAdmin";
import {
  ADMIN_AREAS,
  AREA_LABELS,
  SUPER_ONLY_AREAS,
  SUPER_ONLY_REASONS,
  parseAdminPermissions,
  buildPermissionString,
  type AdminArea,
  type AreaGrant,
} from "@/lib/admin-areas";

/**
 * The grant editor used to offer thirty checkboxes that mostly did nothing.
 *
 * Every "Manage X" code (2, 4, 6, 8, a, c…) was decorative: the route guard
 * only ever read the "View X" code, so ticking "Manage Orders" alone granted
 * no access at all. The labels were wrong as well — the box marked "View CSV
 * Upload" wrote `d`, which the guard read as Suggestions.
 *
 * It now edits areas directly, with a real read/full distinction, and writes
 * the same v2 format the API reads.
 */

export default function AdminManagementPage() {
  const { data: adminsData, isLoading } = useAdmins();
  const createAdmin = useCreateAdmin();
  const updateAdmin = useUpdateAdmin();
  const deleteAdmin = useDeleteAdmin();
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [form, setForm] = useState({ name: "", phone: "", department: "General", permissions: "" });
  const [search, setSearch] = useState("");

  // The form edits areas; `form.permissions` is written from them on save.
  const [isSuper, setIsSuper] = useState(false);
  const [grants, setGrants] = useState<Record<string, AreaGrant>>({});

  const editableAreas = ADMIN_AREAS.filter((a) => !SUPER_ONLY_AREAS.includes(a));

  const loadGrantsFrom = (permissions: string | undefined) => {
    const caps = parseAdminPermissions(permissions);
    setIsSuper(caps.isSuper);
    setGrants(caps.areas);
    return caps;
  };

  const setAreaGrant = (area: AdminArea, level: AreaGrant) =>
    setGrants((g) => ({ ...g, [area]: level }));

  const admins: any[] = Array.isArray(adminsData) ? adminsData : (adminsData?.data ?? []);
  const filtered = admins.filter((a: any) =>
    !search || (a.name ?? "").toLowerCase().includes(search.toLowerCase()) || (a.phone ?? "").includes(search)
  );

  const openCreate = () => {
    setEditingAdmin(null);
    setForm({ name: "", phone: "", department: "General", permissions: "" });
    loadGrantsFrom("");
    setShowModal(true);
  };

  const openEdit = (admin: any) => {
    setEditingAdmin(admin);
    setForm({ name: admin.name ?? "", phone: admin.phone ?? "", department: admin.department ?? "General", permissions: admin.permissions ?? "" });
    loadGrantsFrom(admin.permissions);
    setShowModal(true);
  };

  const handleSave = async () => {
    // Saving always writes the v2 format, so an admin edited here stops being
    // a legacy grant and starts meaning exactly what the boxes say.
    const permissions = buildPermissionString(isSuper, grants);

    try {
      if (editingAdmin) {
        // Omit phone for updates as it's not editable and may trigger validation errors (forbidNonWhitelisted)
        // This also prevents potential issues if the backend expects a strict DTO without 'phone'
        const { phone, ...payload } = form;
        await updateAdmin.mutateAsync({ adminId: editingAdmin.id, payload: { ...payload, permissions } });
        toast.success("Admin updated");
      } else {
        await createAdmin.mutateAsync({ ...form, permissions });
        toast.success("Admin created");
      }
      setShowModal(false);
    } catch {
      toast.error(editingAdmin ? "Failed to update admin" : "Failed to create admin");
    }
  };

  const handleDelete = async (admin: any) => {
    if (!window.confirm(`Remove admin "${admin.name}"?`)) return;
    try {
      await deleteAdmin.mutateAsync(admin.id);
      toast.success("Admin removed");
    } catch {
      toast.error("Failed to remove admin");
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Loading admins…</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-2xl text-foreground">Admin Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{admins.length} admin users</p>
          </div>
          <Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>Add Admin</Button>
        </div>

        <div className="max-w-sm">
          <Input placeholder="Search admins…" value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  {["Admin", "Phone", "Unique ID", "Department", "Permissions", "Created", "Actions"].map(h => (
                    <th key={h} className="px-5 py-3.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">No admins found</td></tr>
                ) : filtered.map((admin: any, i: number) => (
                  <motion.tr key={admin.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="hover:bg-accent/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <Shield className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-semibold text-foreground">{admin.name ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-mono text-muted-foreground">{admin.phone ?? "—"}</td>
                    <td className="px-5 py-4 max-w-[120px]">
                      <span className="font-mono text-[10px] text-muted-foreground break-all whitespace-normal leading-tight block">{admin.id}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <Badge variant={parseAdminPermissions(admin.permissions).isSuper ? "purple" : "info"}>
                        {parseAdminPermissions(admin.permissions).isSuper ? "Super Admin" : (admin.department || "Admin")}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      {(() => {
                        const caps = parseAdminPermissions(admin.permissions);
                        if (caps.isSuper) {
                          return <div className="flex justify-center"><Badge variant="purple" size="sm">All areas</Badge></div>;
                        }
                        if (caps.format === "invalid") {
                          return (
                            <div className="flex justify-center" title="This admin's stored permissions could not be read, so nothing is granted.">
                              <Badge variant="warning" size="sm">Unreadable — no access</Badge>
                            </div>
                          );
                        }
                        const held = (ADMIN_AREAS as readonly AdminArea[]).filter(
                          (a) => caps.areas[a] && caps.areas[a] !== "none",
                        );
                        return (
                          <div className="flex flex-wrap gap-1 justify-center items-center">
                            {held.slice(0, 3).map((a) => (
                              <Badge key={a} size="sm">
                                {AREA_LABELS[a]}{caps.areas[a] === "read" ? " (view)" : ""}
                              </Badge>
                            ))}
                            {held.length > 3 && <Badge size="sm">+{held.length - 3}</Badge>}
                            {held.length === 0 && <span className="text-xs text-muted-foreground">No areas</span>}
                            {caps.format === "legacy" && (
                              <span title="Set before area permissions existed. Editing this admin converts it.">
                                <Badge variant="info" size="sm">legacy</Badge>
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground text-center">{admin.createdAt ? new Date(admin.createdAt).toLocaleDateString("en-IN") : "—"}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(admin)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(admin)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingAdmin ? "Edit Admin" : "Add Admin"}>
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Admin name" />
          <Input label="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="10-digit phone" disabled={!!editingAdmin} />
          <Input label="Department" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g. Sales, Operations, Technical" />
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">System Permissions</label>
            <div className="space-y-3">
              <div className={cn(
                "p-3 rounded-xl transition-all border",
                isSuper
                  ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-900/40"
                  : "bg-muted/30 border-transparent hover:border-border"
              )}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={isSuper}
                    onChange={e => setIsSuper(e.target.checked)}
                    className="h-4 w-4 rounded border-purple-300 text-purple-600 focus:ring-purple-500" />
                  <div>
                    <div className="text-sm font-semibold text-foreground">Super Admin (Full Access)</div>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                      Everything below, plus admin accounts, CSV upload and data migration —
                      the three areas that cannot be granted on their own.
                    </p>
                  </div>
                </label>
              </div>

              {!isSuper && (
                <>
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Area</span>
                    <div className="flex gap-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      <span className="w-14 text-center">None</span>
                      <span className="w-14 text-center">View</span>
                      <span className="w-14 text-center">Manage</span>
                    </div>
                  </div>

                  <div className="max-h-[320px] overflow-y-auto pr-1 space-y-0.5">
                    {editableAreas.map((area) => {
                      const current = grants[area] ?? "none";
                      return (
                        <div key={area} className="flex items-center justify-between gap-3 px-1 py-1.5 rounded-lg hover:bg-muted/40 transition-colors">
                          <span className="text-xs text-foreground flex-1 min-w-0 truncate">{AREA_LABELS[area]}</span>
                          <div className="flex gap-1 flex-shrink-0">
                            {(["none", "read", "full"] as AreaGrant[]).map((level) => (
                              <button
                                key={level}
                                type="button"
                                aria-pressed={current === level}
                                onClick={() => setAreaGrant(area, level)}
                                className={cn(
                                  "w-14 py-1 rounded-md text-[11px] font-medium border transition-colors",
                                  current === level
                                    ? level === "none"
                                      ? "bg-muted text-muted-foreground border-border"
                                      : "bg-primary/10 text-primary border-primary/30"
                                    : "border-transparent text-muted-foreground hover:bg-muted/60"
                                )}
                              >
                                {level === "none" ? "None" : level === "read" ? "View" : "Manage"}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-1.5">
                    <p className="text-[11px] font-semibold text-foreground">Super admins only</p>
                    {SUPER_ONLY_AREAS.map((area) => (
                      <p key={area} className="text-[10px] text-muted-foreground leading-tight">
                        <span className="font-medium text-foreground/80">{AREA_LABELS[area]}</span>
                        {" — "}{SUPER_ONLY_REASONS[area]}
                      </p>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={createAdmin.isPending || updateAdmin.isPending}>
              {editingAdmin ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
