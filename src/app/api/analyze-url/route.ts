// Signal · analyzeUrl — inspecciona la superficie de una web y construye el grafo de relaciones.
//
// Renderiza la página con un navegador headless (Playwright) en vez de solo leer el HTML
// crudo: la mayoría de scripts de terceros, tags de GTM y trackers se inyectan vía JS después
// de la carga inicial, así que un fetch() plano los pierde casi todos.

import { type Browser, chromium } from "playwright";

export const runtime = "nodejs";
export const maxDuration = 60;

interface TechSignature {
  name: string;
  category: string;
  kind: "tagmanager" | "analytics" | "tracker" | "tech";
  match: string[];
}

const TECH_SIGNATURES: TechSignature[] = [
  {
    name: "Google Tag Manager",
    category: "Tag Manager",
    kind: "tagmanager",
    match: ["googletagmanager.com/gtm.js", "dataLayer"],
  },
  {
    name: "Google Analytics 4",
    category: "Analytics",
    kind: "analytics",
    match: ["gtag(", "google-analytics.com", "googletagmanager.com/gtag"],
  },
  {
    name: "Facebook Pixel",
    category: "Tracking social",
    kind: "tracker",
    match: ["connect.facebook.net", "fbevents.js", "fbq("],
  },
  {
    name: "Hotjar",
    category: "Analytics",
    kind: "analytics",
    match: ["hotjar", "hj("],
  },
  {
    name: "Microsoft Clarity",
    category: "Analytics",
    kind: "analytics",
    match: ["clarity.ms", "clarity("],
  },
  {
    name: "Segment",
    category: "Analytics",
    kind: "analytics",
    match: ["cdn.segment.com", "segment.io"],
  },
  {
    name: "Mixpanel",
    category: "Analytics",
    kind: "analytics",
    match: ["mixpanel"],
  },
  {
    name: "Amplitude",
    category: "Analytics",
    kind: "analytics",
    match: ["amplitude"],
  },
  {
    name: "Intercom",
    category: "Soporte",
    kind: "analytics",
    match: ["intercom"],
  },
  {
    name: "HubSpot",
    category: "Marketing",
    kind: "analytics",
    match: ["hs-scripts.com", "hubspot"],
  },
  {
    name: "LinkedIn Insight Tag",
    category: "Tracking social",
    kind: "tracker",
    match: ["snap.licdn.com", "_linkedin_partner_id"],
  },
  {
    name: "TikTok Pixel",
    category: "Tracking social",
    kind: "tracker",
    match: ["analytics.tiktok.com"],
  },
  {
    name: "Pinterest Tag",
    category: "Tracking social",
    kind: "tracker",
    match: ["ct.pinterest.com", "pintrk("],
  },
  {
    name: "X Ads Pixel",
    category: "Tracking social",
    kind: "tracker",
    match: ["static.ads-twitter.com"],
  },
  {
    name: "Bing UET",
    category: "Tracking social",
    kind: "tracker",
    match: ["bat.bing.com"],
  },
  { name: "Stripe", category: "Pagos", kind: "tech", match: ["js.stripe.com"] },
  {
    name: "PayPal",
    category: "Pagos",
    kind: "tech",
    match: ["paypal.com/sdk", "paypalobjects"],
  },
  {
    name: "reCAPTCHA",
    category: "Seguridad",
    kind: "tech",
    match: ["recaptcha"],
  },
  {
    name: "WordPress",
    category: "CMS",
    kind: "tech",
    match: ["wp-content", "wp-includes"],
  },
  {
    name: "Shopify",
    category: "E-commerce",
    kind: "tech",
    match: ["cdn.shopify.com"],
  },
  {
    name: "Wix",
    category: "CMS",
    kind: "tech",
    match: ["static.wixstatic.com", "wix.com"],
  },
  {
    name: "Squarespace",
    category: "CMS",
    kind: "tech",
    match: ["squarespace"],
  },
  { name: "Webflow", category: "CMS", kind: "tech", match: ["webflow"] },
  {
    name: "Next.js",
    category: "Framework",
    kind: "tech",
    match: ["/_next/", "__next"],
  },
  {
    name: "Nuxt",
    category: "Framework",
    kind: "tech",
    match: ["/_nuxt/", "__nuxt"],
  },
  {
    name: "React",
    category: "Framework",
    kind: "tech",
    match: ["data-reactroot", "_reactlistening", "react-dom"],
  },
  {
    name: "Vue",
    category: "Framework",
    kind: "tech",
    match: ["data-v-", "vuejs"],
  },
  {
    name: "Angular",
    category: "Framework",
    kind: "tech",
    match: ["ng-version", "angular.io"],
  },
  { name: "Svelte", category: "Framework", kind: "tech", match: ["svelte"] },
  { name: "jQuery", category: "Librería", kind: "tech", match: ["jquery"] },
  { name: "Bootstrap", category: "UI", kind: "tech", match: ["bootstrap"] },
  {
    name: "Google Fonts",
    category: "Fuentes",
    kind: "tech",
    match: ["fonts.googleapis.com"],
  },
  {
    name: "Adobe Fonts",
    category: "Fuentes",
    kind: "tech",
    match: ["use.typekit.net", "typekit"],
  },
  {
    name: "Font Awesome",
    category: "Fuentes",
    kind: "tech",
    match: ["fontawesome", "font-awesome"],
  },
  {
    name: "Cloudflare",
    category: "Infraestructura",
    kind: "tech",
    match: ["cdn-cgi", "cloudflare"],
  },
  {
    name: "Sentry",
    category: "Monitorización",
    kind: "tech",
    match: ["sentry"],
  },
  {
    name: "Datadog",
    category: "Monitorización",
    kind: "tech",
    match: ["datadog", "ddog"],
  },
  {
    name: "Google Maps",
    category: "Servicios",
    kind: "tech",
    match: ["maps.googleapis.com/maps", "maps.google.com"],
  },
  {
    name: "YouTube Embed",
    category: "Servicios",
    kind: "tech",
    match: ["youtube.com/embed", "youtube-nocookie"],
  },
  {
    name: "Vimeo",
    category: "Servicios",
    kind: "tech",
    match: ["player.vimeo.com", "vimeo.com"],
  },
  {
    name: "OneTrust",
    category: "Consentimiento",
    kind: "tech",
    match: ["onetrust", "cookielaw.org"],
  },
  {
    name: "Cookiebot",
    category: "Consentimiento",
    kind: "tech",
    match: ["cookiebot"],
  },
  {
    name: "Google Ad Manager / DoubleClick",
    category: "Publicidad",
    kind: "tracker",
    match: ["doubleclick.net", "googlesyndication.com", "googleadservices.com"],
  },
  {
    name: "Criteo",
    category: "Publicidad",
    kind: "tracker",
    match: ["criteo.com", "criteo.net"],
  },
  {
    name: "Taboola",
    category: "Publicidad",
    kind: "tracker",
    match: ["taboola.com"],
  },
  {
    name: "Outbrain",
    category: "Publicidad",
    kind: "tracker",
    match: ["outbrain.com"],
  },
  {
    name: "Amazon Ads",
    category: "Publicidad",
    kind: "tracker",
    match: ["amazon-adsystem.com"],
  },
  {
    name: "PubMatic",
    category: "Publicidad",
    kind: "tracker",
    match: ["pubmatic.com"],
  },
  {
    name: "OpenX",
    category: "Publicidad",
    kind: "tracker",
    match: ["openx.net"],
  },
  {
    name: "Magnite (Rubicon)",
    category: "Publicidad",
    kind: "tracker",
    match: ["rubiconproject.com"],
  },
  {
    name: "Index Exchange",
    category: "Publicidad",
    kind: "tracker",
    match: ["casalemedia.com", "indexexchange.com"],
  },
  {
    name: "comScore",
    category: "Analytics",
    kind: "tracker",
    match: ["scorecardresearch.com"],
  },
  {
    name: "Chartbeat",
    category: "Analytics",
    kind: "analytics",
    match: ["chartbeat.com", "chartbeat.net"],
  },
  {
    name: "Optimizely",
    category: "Analytics",
    kind: "analytics",
    match: ["optimizely.com"],
  },
  {
    name: "Permutive",
    category: "Analytics",
    kind: "analytics",
    match: ["permutive.com"],
  },
];

const TRACKER_SUBSTRINGS = [
  "doubleclick",
  "googlesyndication",
  "googleadservices",
  "criteo",
  "taboola",
  "outbrain",
  "adroll",
  "scorecardresearch",
  "quantserve",
  "amazon-adsystem",
  "adnxs",
  "rubiconproject",
  "pubmatic",
  "openx",
  "smartadserver",
  "moatads",
  "adform",
  "sharethrough",
  "ads-twitter",
  "snap.licdn",
  "bat.bing",
  "analytics.tiktok",
  "ct.pinterest",
  "connect.facebook",
  "fingerprint",
];
const ANALYTICS_SUBSTRINGS = [
  "google-analytics",
  "googletagmanager",
  "segment.com",
  "segment.io",
  "mixpanel",
  "amplitude",
  "hotjar",
  "clarity.ms",
  "fullstory",
  "heap.io",
  "mouseflow",
  "luckyorange",
  "statcounter",
  "matomo",
  "plausible",
  "newrelic",
  "nr-data",
  "go-mpulse",
  "chartbeat",
  "optimizely",
];
const FONT_SUBSTRINGS = [
  "fonts.googleapis",
  "fonts.gstatic",
  "use.typekit",
  "typekit.net",
  "fontawesome",
  "font-awesome",
  "use.fontawesome",
  "fonts.bunny",
  "fonts.shopify",
];

type DomainClass = "tracker" | "analytics" | "font" | "other";

function classifyDomain(hay: string): DomainClass {
  if (TRACKER_SUBSTRINGS.some((s) => hay.includes(s))) return "tracker";
  if (ANALYTICS_SUBSTRINGS.some((s) => hay.includes(s))) return "analytics";
  if (FONT_SUBSTRINGS.some((s) => hay.includes(s))) return "font";
  return "other";
}

interface DomainEntry {
  host: string;
  urls: string[];
  types: Record<string, number>;
  lazy: number;
  direct: number;
}

interface BackendGraphNode {
  id: string;
  kind: string;
  label: string;
  parent: string | null;
  sub?: string;
  count?: number;
  details?: Record<string, unknown>;
}

type NewGraphNode = Omit<BackendGraphNode, "id">;

interface AnalyzeRequestBody {
  url?: unknown;
}

const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

// Reutilizado entre requests (arrancar Chromium cuesta ~1-2s): es un pool de un recurso
// compartido, como una conexión de DB, no estado propio de una petición — cada análisis
// abre su propio browser CONTEXT (aislado: cookies/caché propias) y lo cierra al terminar.
let browserPromise: Promise<Browser> | null = null;
function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = chromium.launch({
      headless: true,
      args: ["--disable-dev-shm-usage"],
    });
  }
  return browserPromise;
}

interface CapturedRequest {
  url: string;
  resourceType: string;
  isMainFrame: boolean;
  at: number;
}

export async function POST(req: Request) {
  try {
    let body: AnalyzeRequestBody;
    try {
      body = (await req.json()) as AnalyzeRequestBody;
    } catch {
      return Response.json(
        { error: "Cuerpo de la petición inválido." },
        { status: 400 },
      );
    }
    const raw = typeof body.url === "string" ? body.url.trim() : "";
    if (!raw)
      return Response.json({ error: "Introduce una URL." }, { status: 400 });
    if (raw.length > 500)
      return Response.json({ error: "URL demasiado larga." }, { status: 400 });
    const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    let target: URL;
    try {
      target = new URL(candidate);
    } catch {
      return Response.json({ error: "URL no válida." }, { status: 400 });
    }
    if (target.protocol !== "http:" && target.protocol !== "https:") {
      return Response.json(
        { error: "Protocolo no soportado." },
        { status: 400 },
      );
    }

    const browser = await getBrowser();
    const context = await browser.newContext({
      userAgent: USER_AGENT,
      viewport: { width: 1280, height: 800 },
      ignoreHTTPSErrors: true,
    });
    context.setDefaultNavigationTimeout(20000);
    context.setDefaultTimeout(10000);

    try {
      const page = await context.newPage();

      const requests: CapturedRequest[] = [];
      let domReadyAt = 0;
      page.on("request", (request) => {
        requests.push({
          url: request.url(),
          resourceType: request.resourceType(),
          isMainFrame: request.frame() === page.mainFrame(),
          at: Date.now(),
        });
      });
      page.once("domcontentloaded", () => {
        domReadyAt = Date.now();
      });

      const started = Date.now();
      let response: Awaited<ReturnType<typeof page.goto>>;
      try {
        response = await page.goto(target.toString(), {
          waitUntil: "domcontentloaded",
          timeout: 20000,
        });
      } catch {
        return Response.json(
          { error: `No se pudo conectar con ${target.hostname}.` },
          { status: 502 },
        );
      }
      if (!response) {
        return Response.json(
          { error: `No se pudo conectar con ${target.hostname}.` },
          { status: 502 },
        );
      }

      // deja un margen para que tags cargados de forma diferida (GTM, trackers async) disparen,
      // sin bloquear indefinidamente en páginas que nunca llegan a estar "quietas" en red.
      await page
        .waitForLoadState("networkidle", { timeout: 8000 })
        .catch(() => {});
      const loadTimeMs = Date.now() - started;

      const html = await page.content();
      const title = await page.title();
      const finalUrl = page.url();
      const finalParsed = new URL(finalUrl);
      const rootHost = finalParsed.hostname;
      const status = response.status();
      const responseHeaders = response.headers();
      const cookies = await context.cookies();

      const rootLabels = rootHost.split(".");
      const rootSuffix =
        rootLabels.length >= 2 ? rootLabels.slice(-2).join(".") : rootHost;
      const isFirstParty = (host: string) =>
        host === rootHost || host.endsWith(`.${rootSuffix}`);

      const scanText =
        `${html} ${requests.map((r) => r.url).join(" ")}`.toLowerCase();

      // --- agregación por dominio, a partir de requests de red reales (post-ejecución de JS) ---
      const domainMap: Record<string, DomainEntry> = {};
      const addResource = (url: string, type: string, isLazy: boolean) => {
        let u: URL;
        try {
          u = new URL(url);
        } catch {
          return;
        }
        if (!u.hostname) return;
        const key = u.hostname;
        if (!domainMap[key])
          domainMap[key] = {
            host: key,
            urls: [],
            types: {},
            lazy: 0,
            direct: 0,
          };
        const d = domainMap[key];
        d.types[type] = (d.types[type] || 0) + 1;
        if (isLazy) d.lazy += 1;
        else d.direct += 1;
        if (d.urls.length < 10) d.urls.push(u.toString().slice(0, 200));
      };

      const scriptRequests = requests.filter(
        (r) => r.resourceType === "script",
      );
      for (const r of requests) {
        if (r.resourceType === "document" && r.isMainFrame) continue; // la navegación principal, no un recurso
        const type =
          r.resourceType === "document" && !r.isMainFrame
            ? "iframe"
            : r.resourceType;
        const isLazy = domReadyAt > 0 && r.at > domReadyAt;
        addResource(r.url, type, isLazy);
      }

      const externalDomains = Object.values(domainMap).filter(
        (d) => !isFirstParty(d.host),
      );
      // Ordenados por severidad primero (tracker > analytics > resto) y luego por volumen de
      // requests: muchos trackers reales solo disparan un píxel/XHR (0 scripts, 0 iframes), así
      // que filtrar/ordenar por script+iframe los dejaba fuera del grafo aunque sí contaban en
      // summary.trackers.
      const DOMAIN_CLASS_WEIGHT: Record<DomainClass, number> = {
        tracker: 0,
        analytics: 1,
        other: 2,
        font: 3,
      };
      const totalRequests = (d: DomainEntry) =>
        Object.values(d.types).reduce((a, b) => a + b, 0);
      const rankedDomains = [...externalDomains].sort((a, b) => {
        const ca = classifyDomain(`${a.host} ${a.urls[0] || ""}`.toLowerCase());
        const cb = classifyDomain(`${b.host} ${b.urls[0] || ""}`.toLowerCase());
        if (DOMAIN_CLASS_WEIGHT[ca] !== DOMAIN_CLASS_WEIGHT[cb])
          return DOMAIN_CLASS_WEIGHT[ca] - DOMAIN_CLASS_WEIGHT[cb];
        return totalRequests(b) - totalRequests(a);
      });
      const fontDomains = externalDomains.filter((d) =>
        FONT_SUBSTRINGS.some((s) =>
          `${d.host} ${d.urls[0] || ""}`.toLowerCase().includes(s),
        ),
      );

      const thirdPartyScripts = scriptRequests.filter((r) => {
        try {
          return !isFirstParty(new URL(r.url).hostname);
        } catch {
          return false;
        }
      }).length;

      // --- tecnologías ---
      const techsFound = TECH_SIGNATURES.filter((t) =>
        t.match.some((s) => scanText.includes(s.toLowerCase())),
      );
      const gtm = techsFound.find((t) => t.kind === "tagmanager") || null;
      const chainTechs = gtm
        ? techsFound.filter(
            (t) => t.kind === "analytics" || t.kind === "tracker",
          )
        : [];
      const plainTechs = gtm
        ? techsFound.filter(
            (t) =>
              t.kind !== "tagmanager" &&
              t.kind !== "analytics" &&
              t.kind !== "tracker",
          )
        : techsFound;

      // --- headers seleccionados ---
      const headerNames = [
        "server",
        "x-powered-by",
        "content-security-policy",
        "strict-transport-security",
        "x-frame-options",
        "x-content-type-options",
        "cache-control",
        "via",
        "content-type",
        "referrer-policy",
        "permissions-policy",
      ];
      const headers = headerNames
        .map((n) => {
          const v = responseHeaders[n];
          return v ? { name: n, value: v.slice(0, 180) } : null;
        })
        .filter((h): h is { name: string; value: string } => Boolean(h));

      const hasCsp = Boolean(responseHeaders["content-security-policy"]);
      const https = finalParsed.protocol === "https:";
      const trackerDomains = externalDomains.filter(
        (d) =>
          classifyDomain(`${d.host} ${d.urls[0] || ""}`.toLowerCase()) ===
          "tracker",
      );
      const trackerCount = new Set([
        ...trackerDomains.map((d) => d.host),
        ...techsFound.filter((t) => t.kind === "tracker").map((t) => t.name),
      ]).size;
      const insecureCookies = cookies.filter(
        (c) => !c.secure || !c.httpOnly,
      ).length;

      // --- privacidad ---
      const privacy: string[] = [];
      if (trackerCount > 0)
        privacy.push(
          `${trackerCount} dominios con capacidad de rastreo publicitario.`,
        );
      if (gtm)
        privacy.push(
          "Google Tag Manager carga scripts de terceros dinámicamente: el HTML inicial es solo el arranque.",
        );
      if (!https) privacy.push("La conexión no viaja cifrada (HTTP).");
      if (!hasCsp)
        privacy.push(
          "Sin Content-Security-Policy: el navegador ejecuta cualquier script que la página cargue.",
        );
      if (insecureCookies > 0)
        privacy.push(`${insecureCookies} cookies sin flag Secure o HttpOnly.`);
      if (scanText.includes("fingerprint"))
        privacy.push("Posible fingerprinting de dispositivos.");

      // --- grafo ---
      let seq = 0;
      const nodes: BackendGraphNode[] = [];
      const push = (node: NewGraphNode): string => {
        const id = `${node.kind}-${seq++}`;
        nodes.push({ ...node, id });
        return id;
      };

      const rootId = push({
        kind: "root",
        label: rootHost,
        parent: null,
        details: {
          title,
          finalUrl,
          https,
          status,
          loadTimeMs,
          sizeKb: Math.round(html.length / 1024),
          scriptsTotal: scriptRequests.length,
          scriptsThirdParty: thirdPartyScripts,
          thirdPartyDomains: externalDomains.length,
          trackers: trackerCount,
          cookies: cookies.length,
        },
      });

      let gtmId: string | null = null;
      if (gtm) {
        gtmId = push({
          kind: "tech",
          label: gtm.name,
          sub: "Tag Manager",
          parent: rootId,
          details: {
            category: "Tag Manager",
            description:
              "Carga tags de terceros dinámicamente después del arranque de la página.",
          },
        });
        chainTechs.slice(0, 8).forEach((t) => {
          push({
            kind: "tech",
            label: t.name,
            sub: t.category,
            parent: gtmId,
            details: { category: t.category },
          });
        });
      }

      if (plainTechs.length) {
        const catId = push({
          kind: "category",
          label: "Tecnologías",
          count: plainTechs.length,
          parent: rootId,
          details: {
            description:
              "Stack detectado por firmas en la superficie renderizada.",
          },
        });
        plainTechs.slice(0, 12).forEach((t) => {
          push({
            kind: "tech",
            label: t.name,
            sub: t.category,
            parent: catId,
            details: { category: t.category },
          });
        });
      }

      if (rankedDomains.length) {
        const catId = push({
          kind: "category",
          label: "Scripts de terceros",
          count: thirdPartyScripts,
          parent: rootId,
          details: {
            description:
              "Dominios externos con actividad detectada durante el render (scripts, píxeles, llamadas de red).",
          },
        });
        rankedDomains.slice(0, 10).forEach((d) => {
          const k = classifyDomain(
            `${d.host} ${d.urls[0] || ""}`.toLowerCase(),
          );
          push({
            kind: k === "tracker" ? "tracker" : "domain",
            label: d.host,
            sub:
              k === "tracker"
                ? "rastreo"
                : k === "analytics"
                  ? "analytics"
                  : "terceros",
            count: totalRequests(d),
            parent: catId,
            details: {
              urls: d.urls,
              types: d.types,
              kind: k,
              loadType: d.lazy > d.direct ? "lazy" : "direct",
            },
          });
        });
      }

      if (cookies.length) {
        const catId = push({
          kind: "category",
          label: "Cookies",
          count: cookies.length,
          parent: rootId,
          details: {
            description:
              "Cookies presentes tras la carga completa de la página.",
          },
        });
        cookies.slice(0, 8).forEach((c) => {
          push({
            kind: "cookie",
            label: c.name,
            sub: c.secure ? "secure" : "sin Secure",
            parent: catId,
            details: {
              raw: `${c.name}=${c.value}`.slice(0, 200),
              secure: c.secure,
              httponly: c.httpOnly,
              samesite: c.sameSite ? c.sameSite.toLowerCase() : null,
            },
          });
        });
      }

      if (fontDomains.length) {
        const catId = push({
          kind: "category",
          label: "Fuentes & assets",
          count: fontDomains.length,
          parent: rootId,
          details: {
            description: "Tipografías y recursos externos de estilo.",
          },
        });
        fontDomains.slice(0, 6).forEach((d) => {
          push({
            kind: "font",
            label: d.host,
            sub: "fuente",
            parent: catId,
            details: { urls: d.urls, types: d.types },
          });
        });
      }

      // --- cadena de causalidad ---
      const chain = [rootHost];
      if (gtm) chain.push("GTM");
      if (chainTechs.some((t) => t.name.includes("Google Analytics")))
        chain.push("Google Analytics");
      if (scriptRequests.length) chain.push(`${scriptRequests.length} scripts`);
      if (externalDomains.length)
        chain.push(`${externalDomains.length} dominios externos`);
      if (trackerCount) chain.push(`${trackerCount} trackers`);

      const summary = {
        url: target.toString(),
        finalUrl,
        domain: rootHost,
        title,
        https,
        status,
        loadTimeMs,
        sizeKb: Math.round(html.length / 1024),
        scriptsTotal: scriptRequests.length,
        scriptsThirdParty: thirdPartyScripts,
        externalDomains: externalDomains.length,
        trackers: trackerCount,
        cookies: cookies.length,
        headers,
        privacy,
        chain,
      };

      return Response.json({ ok: true, summary, nodes, rootId });
    } finally {
      await context.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json(
      { error: `No se pudo analizar la URL: ${message}` },
      { status: 500 },
    );
  }
}
