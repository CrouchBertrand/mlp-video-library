import { deleteModuleAction, upsertModuleAction } from "@/app/admin/actions";
import { Notice } from "@/components/admin-shell";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { FormActions, PageTitle, SelectField, TextArea, TextField } from "@/components/admin-form";
import { prisma } from "@/lib/prisma";

export default async function ModulesPage({ searchParams }: { searchParams: Promise<{ edit?: string; success?: string; error?: string }> }) {
  const params = await searchParams;
  const categories = await prisma.module.findMany({ orderBy: { sortOrder: "asc" }, include: { parent: true } });
  const edit = params.edit ? await prisma.module.findUnique({ where: { id: params.edit } }) : null;
  return (
    <div>
      <PageTitle title="Manage Categories" description="Create and organize the main Marketplace Literacy resource categories." />
      <Notice success={params.success} error={params.error} />
      <form action={upsertModuleAction} className="mb-8 grid gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#edf0f3] sm:p-6 md:grid-cols-2">
        <input type="hidden" name="id" value={edit?.id ?? ""} />
        <TextField label="Category name" name="name" defaultValue={edit?.name} required />
        <SelectField label="Parent category optional" name="parentId" defaultValue={edit?.parentId}>
          <option value="">No parent</option>
          {categories.filter((category) => category.id !== edit?.id).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </SelectField>
        <TextArea label="Description" name="description" defaultValue={edit?.description} />
        <TextField label="Badge color" name="color" defaultValue={edit?.color ?? "#f3e8e6"} type="color" />
        <TextField label="Sort order" name="sortOrder" defaultValue={edit?.sortOrder ?? 0} type="number" />
        <label className="flex items-center gap-2 pt-7 font-semibold"><input type="checkbox" name="isActive" defaultChecked={edit?.isActive ?? true} className="accent-[#a64026]" /> Active</label>
        <div className="md:col-span-2"><FormActions submitLabel={edit ? "Save category" : "Add category"} cancelHref="/admin/modules" /></div>
      </form>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#edf0f3]">
        {categories.map((category) => (
          <div key={category.id} className="grid gap-3 border-b border-[#edf0f3] p-4 last:border-0 md:grid-cols-[1fr_auto_auto] md:items-center">
            <div><strong>{category.name}</strong><div className="text-sm text-[#6b7c8f]">{category.parent?.name ?? "No parent"} - {category.isActive ? "Active" : "Inactive"}</div></div>
            <a href={`/admin/modules?edit=${category.id}`} className="mlp-btn-outline">Edit</a>
            <form action={deleteModuleAction}><input type="hidden" name="id" value={category.id} /><ConfirmDeleteButton message={`Delete "${category.name}"? This cannot be undone.`} /></form>
          </div>
        ))}
      </div>
    </div>
  );
}
