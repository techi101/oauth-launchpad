import {
  CUSTOM_VS_MANAGED_URL,
  findToolkit,
  MANAGED_URL,
  PRICING_URL,
  SNAPSHOT,
  V1_CALLBACK,
  V3_CALLBACK,
  WHITE_LABEL_URL,
} from "@/lib/composio";
import type { Guide } from "@/lib/schema";
import { Section } from "./ui";

const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noreferrer" className="text-accent underline">
    {children}
  </a>
);

/**
 * How this provider plugs into Composio. Rendered from the dated toolkit
 * snapshot at view time, so every guide (starter or generated) gets it.
 */
export default function OnComposio({ guide }: { guide: Guide }) {
  const t = findToolkit(guide.provider.name);
  const snap = `Composio data snapshot ${SNAPSHOT.retrieved}`;

  if (!t)
    return (
      <Section id="composio" title="On Composio" hint={snap}>
        <p className="text-sm">
          {guide.provider.name} is not among Composio&apos;s {SNAPSHOT.stats.oauthToolkits} OAuth toolkits, so there is no managed app and
          no auth config to create. Register your own app (checklist above) and call the provider directly, or ask Composio to add the
          toolkit.
        </p>
      </Section>
    );

  const legacyDefault = t.defaultRedirect.includes("/api/v1/");
  const scopes = t.defaultScopes;
  const py = `session = composio.create(
    user_id="user_123",
    auth_configs={"${t.slug}": "ac_your_${t.slug}_config"},
)`;

  return (
    <Section id="composio" title="On Composio" hint={`How ${t.name} plugs into Composio auth configs · ${snap}`}>
      <div className="grid gap-4 text-sm">
        <p>
          <span
            className={`mr-2 rounded px-1.5 py-0.5 text-xs font-semibold ${t.managed ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200" : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"}`}
          >
            {t.managed ? "Managed OAuth available" : "Bring your own OAuth app"}
          </span>
          {t.managed ? (
            <>
              You can start with Composio&apos;s managed app and skip registration. Bring your own app when you need your name on the consent
              screen, scopes the managed app does not request, a separate rate-limit quota, or more than the managed allowance: on the Hobby
              plan only 20,000 of the 100,000 monthly tool calls can use managed apps (<A href={PRICING_URL}>pricing</A>,{" "}
              <A href={CUSTOM_VS_MANAGED_URL}>managed vs custom</A>).
            </>
          ) : (
            <>
              Composio does not provide an app for {t.name} (<A href={MANAGED_URL}>directory</A>), so every developer must register one
              before any user can connect.
            </>
          )}
        </p>

        <ol className="grid list-decimal gap-3 pl-5">
          <li>
            <b>Register the provider app</b> using the checklist above. {t.composioGuide && <>Composio also has a screenshot walkthrough: <A href={t.composioGuide}>{t.composioGuide.replace("https://", "")}</A>. This guide adds approval, timing and evidence.</>}
          </li>
          <li>
            <b>Redirect URI: register exactly the one your auth config shows.</b> Composio&apos;s docs tell you to register{" "}
            <code className="break-all rounded bg-bg px-1 font-mono text-xs">{V3_CALLBACK}</code> (<A href={WHITE_LABEL_URL}>white-labelling docs</A>).{" "}
            {legacyDefault ? (
              <>
                But {t.name}&apos;s auth-config form defaults its <i>Redirect URI</i> field to the legacy{" "}
                <code className="break-all rounded bg-bg px-1 font-mono text-xs">{V1_CALLBACK}</code>. Pick one, put it in both the provider
                portal and the auth config&apos;s Redirect URI field. A mismatch fails with <code className="font-mono text-xs">invalid redirect_uri</code> (
                <A href="https://github.com/ComposioHQ/composio/issues/2999">#2999</A>).
              </>
            ) : (
              <>Copy the value the form shows into the provider portal.</>
            )}
          </li>
          <li>
            <b>Create the auth config:</b> Dashboard → Auth Configs → Create Auth Config → {t.name} → OAuth2 → your own credentials. Required:{" "}
            {t.requiredFields.map((f) => <code key={f} className="mr-1 rounded bg-bg px-1 font-mono text-xs">{f}</code>)}
            {t.optionalFields.length > 0 && <>Optional: {t.optionalFields.map((f) => <code key={f} className="mr-1 rounded bg-bg px-1 font-mono text-xs">{f}</code>)}</>}
          </li>
          {scopes.length > 0 && (
            <li>
              <b>Trim the default scopes.</b> The {t.name} auth config requests {scopes.length}
              {scopes.length >= 60 ? "+" : ""} scopes by default ({scopes.slice(0, 6).join(", ")}
              {scopes.length > 6 ? ", …" : ""}). Keep only what your agent&apos;s tools need: every extra scope shows on the consent screen and
              can push the app into a heavier provider review (see Permissions above).
            </li>
          )}
          <li>
            <b>Use it in a session.</b> Toolkits you leave out stay on managed auth.
            <pre className="mt-1 overflow-x-auto rounded bg-bg p-2 font-mono text-xs">{py}</pre>
          </li>
          <li>
            <b>Verify with one real call after connecting.</b> An <i>ACTIVE</i> connection is not proof the token works (
            <A href="https://github.com/ComposioHQ/composio/issues/4190">#4190</A>,{" "}
            <A href="https://github.com/ComposioHQ/composio/issues/4120">#4120</A>): run one read tool and check it returns data.
          </li>
        </ol>

        {t.issues.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted">KNOWN {t.name.toUpperCase()} ISSUES ON COMPOSIO (GitHub, title mentions)</p>
            <ul className="mt-1 grid list-disc gap-1 pl-5">
              {t.issues.slice(0, 5).map((i) => (
                <li key={i.number}>
                  <A href={i.url}>#{i.number}</A> {i.title}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Section>
  );
}
