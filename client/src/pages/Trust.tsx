/**
 * /trust page — Ojas trust centre.
 *
 * Lists every public-facing legal and security document with a short
 * description, the audience it serves, and links to (a) the rendered
 * static asset under /legal/<slug> and (b) a downloadable copy.
 *
 * The actual document bodies live in `legal/*.md` at the repo root
 * (source of truth) and are copied to `client/public/legal/*.md` so
 * Vite serves them as static assets at deploy time.
 *
 * Until the legal documents have been redlined by a qualified lawyer
 * AND every {{PLACEHOLDER}} has been substituted per
 * `legal/REPLACE_BEFORE_PUBLISHING.md`, this page also shows a clear
 * "DRAFT — pending lawyer review" banner.
 */

type LegalDoc = {
  title: string;
  slug: string;
  description: string;
  audience: "Everyone" | "Customers" | "Enterprise" | "Researchers" | "Internal";
};

const PUBLIC_DOCS: LegalDoc[] = [
  {
    title: "Terms of Service",
    slug: "TERMS_OF_SERVICE.md",
    description:
      "The master agreement that governs every use of Ojas — accounts, fees, IP, warranties, liability, termination, governing law.",
    audience: "Everyone",
  },
  {
    title: "Privacy Policy",
    slug: "PRIVACY_POLICY.md",
    description:
      "What personal data we collect, why, how long we keep it, who we share it with, and the rights you have over it.",
    audience: "Everyone",
  },
  {
    title: "Cookie Policy",
    slug: "COOKIE_POLICY.md",
    description:
      "Every cookie or similar tracker we set, what it does, how long it lasts, and how you opt out.",
    audience: "Everyone",
  },
  {
    title: "Acceptable Use Policy",
    slug: "ACCEPTABLE_USE_POLICY.md",
    description:
      "What you may not do with Ojas — illegal use, harm to people, attacking systems, abusing AI safety, prohibited high-risk applications.",
    audience: "Everyone",
  },
  {
    title: "Service Level Agreement",
    slug: "SLA.md",
    description:
      "Uptime commitment by Subscription tier, service-credit schedule, support response targets, and excluded events.",
    audience: "Customers",
  },
  {
    title: "Refund Policy",
    slug: "REFUND_POLICY.md",
    description:
      "When you can get your money back: 14-day money-back guarantee, cancellations, SLA-credit interactions, AUP-termination handling.",
    audience: "Customers",
  },
  {
    title: "Vulnerability Disclosure Policy",
    slug: "VULNERABILITY_DISCLOSURE.md",
    description:
      "How security researchers should report vulnerabilities, what's in scope, our commitments, and the safe-harbour guarantee for good-faith research.",
    audience: "Researchers",
  },
];

const ENTERPRISE_DOCS: LegalDoc[] = [
  {
    title: "Data Processing Addendum",
    slug: "DPA.md",
    description:
      "GDPR / DPDPA / CCPA-aligned processor agreement with SCCs (Module 2/3) and UK IDTA. Attached to enterprise contracts on request.",
    audience: "Enterprise",
  },
  {
    title: "Sub-processor List",
    slug: "SUBPROCESSORS.md",
    description:
      "Every third party that processes customer data on our behalf, with location and purpose. 30-day notice of changes.",
    audience: "Enterprise",
  },
  {
    title: "Security Statement",
    slug: "SECURITY.md",
    description:
      "Our security posture: compliance status, architecture, encryption, access control, application security, DR, incident response.",
    audience: "Enterprise",
  },
  {
    title: "Mutual NDA — Template",
    slug: "NDA_MUTUAL.md",
    description:
      "Reusable two-way confidentiality agreement for pre-contract conversations with prospective customers, partners, or investors.",
    audience: "Enterprise",
  },
];

const PRODUCT_DOCS: LegalDoc[] = [
  {
    title: "VS Code Extension EULA",
    slug: "VSCODE_EULA.md",
    description:
      "End-User License Agreement for the Ojas VS Code extension, as required by the VS Code Marketplace.",
    audience: "Everyone",
  },
];

const INTERNAL_DOCS: LegalDoc[] = [
  {
    title: "Data Retention Schedule",
    slug: "DATA_RETENTION.md",
    description:
      "How long each category of data is kept, where it lives, and the deletion mechanism. Drives our deletion automation.",
    audience: "Internal",
  },
  {
    title: "Records of Processing Activities (RoPA)",
    slug: "RoPA.md",
    description:
      "Article 30 GDPR / DPDPA-equivalent register of every processing activity we conduct. Disclosed to regulators on request.",
    audience: "Internal",
  },
  {
    title: "Incorporation & Pre-Launch Checklist",
    slug: "INCORPORATION_CHECKLIST.md",
    description:
      "Step-by-step list of company-formation and tax-registration tasks only the founder can do. Tracks the gate to taking paid revenue.",
    audience: "Internal",
  },
  {
    title: "Replace-Before-Publishing Cheat Sheet",
    slug: "REPLACE_BEFORE_PUBLISHING.md",
    description:
      "Every {{PLACEHOLDER}} used across the legal docs and a safe sed-based replacement procedure.",
    audience: "Internal",
  },
];

function DocCard({ doc }: { doc: LegalDoc }) {
  const href = `/legal/${doc.slug}`;
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {doc.title}
        </h3>
        <span className="text-xs rounded-full px-2 py-0.5 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {doc.audience}
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {doc.description}
      </p>
      <div className="mt-4 flex gap-3 text-sm">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
        >
          Read →
        </a>
        <a
          href={href}
          download
          className="font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Download
        </a>
      </div>
    </div>
  );
}

export default function Trust() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Trust Centre
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-3xl">
          Every public-facing legal and security document for the Ojas
          service. Use this page when reviewing Ojas for procurement,
          security questionnaires, or DPA negotiation.
        </p>
      </div>

      <div className="mb-8 rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-700/60 dark:bg-amber-950/40 p-4 text-sm text-amber-900 dark:text-amber-100">
        <strong>Status:</strong> These documents are{" "}
        <strong>first-draft templates</strong> drafted by engineering. They
        have <em>not</em> yet been redlined by a qualified lawyer, and the
        legal entity referenced (&ldquo;Ojas Technologies Private
        Limited&rdquo;) is pending incorporation. Do not rely on these
        documents as currently published; the binding version will be
        published once Phase 1 of the incorporation checklist is complete
        and a lawyer has signed off.
      </div>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
          Public-facing
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {PUBLIC_DOCS.map((d) => (
            <DocCard key={d.slug} doc={d} />
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
          Enterprise / contract attachments
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {ENTERPRISE_DOCS.map((d) => (
            <DocCard key={d.slug} doc={d} />
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
          Product-specific
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {PRODUCT_DOCS.map((d) => (
            <DocCard key={d.slug} doc={d} />
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
          Internal references
        </h2>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
          These documents are not customer-facing — they live in the
          repo so the team and any external auditor can review them, but
          they are not linked from marketing pages.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {INTERNAL_DOCS.map((d) => (
            <DocCard key={d.slug} doc={d} />
          ))}
        </div>
      </section>

      <section className="mt-12 border-t border-slate-200 dark:border-slate-800 pt-6 text-sm text-slate-500 dark:text-slate-400">
        <p>
          Security researchers: please follow the{" "}
          <a
            href="/legal/VULNERABILITY_DISCLOSURE.md"
            className="text-blue-600 dark:text-blue-400 underline"
          >
            Vulnerability Disclosure Policy
          </a>{" "}
          and report to <code>security@ojas.ai</code>. A{" "}
          <a
            href="/.well-known/security.txt"
            className="text-blue-600 dark:text-blue-400 underline"
          >
            security.txt
          </a>{" "}
          file is also available per RFC 9116.
        </p>
        <p className="mt-2">
          Privacy and DPA enquiries: <code>privacy@ojas.ai</code>.
        </p>
        <p className="mt-2">
          Sub-processor notification list: email{" "}
          <code>privacy@ojas.ai</code> with the subject &ldquo;Sub-processor
          notifications&rdquo;.
        </p>
      </section>
    </div>
  );
}
