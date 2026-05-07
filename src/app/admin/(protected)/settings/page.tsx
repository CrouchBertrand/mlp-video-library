import { changePasswordAction, updateSettingsAction } from "@/app/admin/actions";
import { Notice } from "@/components/admin-shell";
import { PageTitle, SaveButton, TextArea, TextField } from "@/components/admin-form";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const params = await searchParams;
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  return (
    <div>
      <PageTitle title="Settings" description="Update site branding, public links, colors, and administrator access." />
      <Notice success={params.success} error={params.error} />
      <form action={updateSettingsAction} className="mb-8 grid gap-5 rounded-2xl bg-white p-7 shadow-sm ring-1 ring-[#edf0f3] md:grid-cols-2">
        <TextField label="Site title" name="siteTitle" defaultValue={settings?.siteTitle} required />
        <TextField label="Main website URL" name="websiteUrl" defaultValue={settings?.websiteUrl} />
        <TextArea label="Site description" name="siteDescription" defaultValue={settings?.siteDescription} />
        <TextField label="YouTube channel URL" name="youtubeChannelUrl" defaultValue={settings?.youtubeChannelUrl} />
        <TextField label="Contact email" name="contactEmail" defaultValue={settings?.contactEmail} type="email" />
        <TextField label="Donation/support link optional" name="supportUrl" defaultValue={settings?.supportUrl} />
        <TextArea label="Footer description" name="footerText" defaultValue={settings?.footerText} />
        <TextField label="Primary color" name="primaryColor" defaultValue={settings?.primaryColor ?? "#A64026"} type="color" />
        <TextField label="Secondary color" name="secondaryColor" defaultValue={settings?.secondaryColor ?? "#624237"} type="color" />
        <label className="block md:col-span-2"><span className="mb-1 block font-semibold">Logo upload placeholder</span><input name="logoFile" type="file" accept="image/*" className="mlp-input h-auto w-full py-2" /></label>
        <div className="md:col-span-2"><SaveButton label="Save settings" /></div>
      </form>
      <form action={changePasswordAction} className="rounded-2xl border border-orange-200 bg-orange-50 p-7">
        <h2 className="text-xl font-extrabold text-[#624237]">Change admin password</h2>
        <p className="mt-2 text-sm text-[#624237]">Use a strong password before public deployment. The seeded local password is ChangeMe123!.</p>
        <div className="mt-5 max-w-md"><TextField label="New password" name="password" type="password" required /></div>
        <div className="mt-5"><SaveButton label="Update password" /></div>
      </form>
    </div>
  );
}
