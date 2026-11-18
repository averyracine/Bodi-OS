import { pageMeta } from "@/lib/seo";
import { site } from "@/content/site";
import { Section } from "@/components/site/Section";
import { PageHero } from "@/components/site/blocks";

export const metadata = pageMeta({ title: "Privacy Policy", description: `How ${site.name} handles information you share through this website.`, path: "/privacy" });

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy policy" />
      <Section tone="white">
        <div className="mx-auto max-w-3xl space-y-5 leading-relaxed text-stone">
          <p className="text-sm text-muted">Plain-language draft. Have it reviewed before launch.</p>
          <p>When you request a consultation or use our price calculator, we collect the details you enter (such as your name, phone, email, address or ZIP, project information and any photos you upload). We also record how you found our site (for example the referring website or ad campaign) and a one-way hash of your IP address for spam protection.</p>
          <p>We use this information only to respond to your request, prepare estimates and manage your project. We do not sell your information. It is stored with our hosting, database and email providers, who process it on our behalf.</p>
          <p>To ask us to update or delete your information, call {site.phone}.</p>
          <p>{site.legalLine}</p>
        </div>
      </Section>
    </>
  );
}
