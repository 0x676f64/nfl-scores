// node_modules/@devvit/protos/json/devvit/ui/effects/v1alpha/effect.js
var EffectType;
(function(EffectType2) {
  EffectType2[EffectType2["EFFECT_REALTIME_SUB"] = 0] = "EFFECT_REALTIME_SUB";
  EffectType2[EffectType2["EFFECT_RERENDER_UI"] = 1] = "EFFECT_RERENDER_UI";
  EffectType2[EffectType2["EFFECT_RELOAD_PART"] = 2] = "EFFECT_RELOAD_PART";
  EffectType2[EffectType2["EFFECT_SHOW_FORM"] = 3] = "EFFECT_SHOW_FORM";
  EffectType2[EffectType2["EFFECT_SHOW_TOAST"] = 4] = "EFFECT_SHOW_TOAST";
  EffectType2[EffectType2["EFFECT_NAVIGATE_TO_URL"] = 5] = "EFFECT_NAVIGATE_TO_URL";
  EffectType2[EffectType2["EFFECT_SET_INTERVALS"] = 7] = "EFFECT_SET_INTERVALS";
  EffectType2[EffectType2["EFFECT_CREATE_ORDER"] = 8] = "EFFECT_CREATE_ORDER";
  EffectType2[EffectType2["EFFECT_WEB_VIEW"] = 9] = "EFFECT_WEB_VIEW";
  EffectType2[EffectType2["EFFECT_CAN_RUN_AS_USER"] = 11] = "EFFECT_CAN_RUN_AS_USER";
  EffectType2[EffectType2["EFFECT_TELEMETRY"] = 12] = "EFFECT_TELEMETRY";
  EffectType2[EffectType2["EFFECT_UPDATE_REQUEST_CONTEXT"] = 13] = "EFFECT_UPDATE_REQUEST_CONTEXT";
  EffectType2[EffectType2["EFFECT_SCREENSHOT_RESPONSE"] = 14] = "EFFECT_SCREENSHOT_RESPONSE";
  EffectType2[EffectType2["EFFECT_LOGIN_PROMPT"] = 15] = "EFFECT_LOGIN_PROMPT";
  EffectType2[EffectType2["EFFECT_PROMOTED_TELEMETRY"] = 16] = "EFFECT_PROMOTED_TELEMETRY";
  EffectType2[EffectType2["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
})(EffectType || (EffectType = {}));

// node_modules/@devvit/protos/json/devvit/ui/effects/web_view/v1alpha/immersive_mode.js
var WebViewImmersiveMode;
(function(WebViewImmersiveMode2) {
  WebViewImmersiveMode2[WebViewImmersiveMode2["UNSPECIFIED"] = 0] = "UNSPECIFIED";
  WebViewImmersiveMode2[WebViewImmersiveMode2["INLINE_MODE"] = 1] = "INLINE_MODE";
  WebViewImmersiveMode2[WebViewImmersiveMode2["IMMERSIVE_MODE"] = 2] = "IMMERSIVE_MODE";
  WebViewImmersiveMode2[WebViewImmersiveMode2["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
})(WebViewImmersiveMode || (WebViewImmersiveMode = {}));

// node_modules/@devvit/protos/json/devvit/ui/effects/web_view/v1alpha/post_message.js
var WebViewInternalMessageScope;
(function(WebViewInternalMessageScope2) {
  WebViewInternalMessageScope2[WebViewInternalMessageScope2["CLIENT"] = 0] = "CLIENT";
  WebViewInternalMessageScope2[WebViewInternalMessageScope2["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
})(WebViewInternalMessageScope || (WebViewInternalMessageScope = {}));

// node_modules/@devvit/shared-types/client/emit-effect.js
var webViewInternalMessageType = "devvit-internal";
var emitEffect = (effect, requestId) => {
  const message = {
    ...effect,
    realtimeEffect: effect.realtime,
    // to-do: remove deprecated field.
    id: requestId,
    scope: WebViewInternalMessageScope.CLIENT,
    type: webViewInternalMessageType
  };
  if (effect.showToast || effect.navigateToUrl) {
    message.effect = effect;
  }
  parent.postMessage(message, "*");
};

// node_modules/@devvit/shared-types/client/telemetry.js
function emitTelemetryClickEffect(event) {
  const click = TelemetryClickPayload(event.target, event.isTrusted);
  void emitEffect({
    type: EffectType.EFFECT_TELEMETRY,
    telemetry: { event: click.event, click },
    // to-do: remove once all clients support `telemetry`. Deprecated on
    //        2025-11-24.
    analytics: click
  });
}
function TelemetryClickPayload(eventTarget, isTrusted) {
  const { definition, elemTrackId } = analyzeClickTarget(eventTarget, isTrusted);
  return { event: "click", definition, elemTrackId };
}
function analyzeClickTarget(eventTarget, isTrusted) {
  const targetElement = getTargetElement(eventTarget);
  if (!targetElement) {
    return { definition: "default", elemTrackId: void 0 };
  }
  let definition = "default";
  if (isTrusted) {
    const computedStyles = globalThis.window.getComputedStyle(targetElement);
    if (computedStyles?.getPropertyValue("cursor") === "pointer") {
      definition = "strict";
    }
  }
  let elemTrackId;
  let currentElement = targetElement;
  while (currentElement) {
    if (elemTrackId === void 0) {
      const dataTrackId = currentElement.getAttribute("data-track-id");
      if (dataTrackId) {
        elemTrackId = dataTrackId;
      } else if (currentElement.id) {
        elemTrackId = currentElement.id;
      }
    }
    if (isTrusted && definition === "default" && elementIsStrictClickTarget(currentElement)) {
      definition = "strict";
    }
    if (elemTrackId !== void 0 && (!isTrusted || definition === "strict")) {
      break;
    }
    currentElement = currentElement.parentElement;
  }
  return { definition, elemTrackId };
}
function getTargetElement(eventTarget) {
  if (!eventTarget || typeof eventTarget !== "object" || !("nodeType" in eventTarget)) {
    return void 0;
  }
  const node = eventTarget;
  return node.nodeType === 1 ? node : node.parentElement ?? void 0;
}
function elementIsStrictClickTarget(element) {
  const STRICT_CLICK_TAGNAMES = ["A", "BUTTON", "CANVAS", "INPUT", "SELECT", "TEXTAREA", "LABEL"];
  return STRICT_CLICK_TAGNAMES.includes(element.tagName) || ["true", "plaintext-only"].includes(element.getAttribute("contenteditable") ?? "");
}

// node_modules/@devvit/shared-types/constants.js
var apiPathPrefix = "/api/";

// node_modules/@devvit/shared-types/webbit.js
var tokenParam = "token";

// node_modules/@devvit/client/effects/web-view-mode.js
var modeListeners = /* @__PURE__ */ new Set();
function getWebViewMode() {
  return webViewMode(devvit.webViewMode);
}
function requestExpandedMode(event, entry) {
  if (devvit.webViewMode === WebViewImmersiveMode.IMMERSIVE_MODE)
    throw Error("web view is already expanded");
  emitTelemetryClickEffect(event);
  emitModeEffect(WebViewImmersiveMode.IMMERSIVE_MODE, event, entry);
}
function emitModeEffect(mode, event, entry) {
  if (!event.isTrusted || event.type !== "click") {
    console.error("Expanded mode effect ignored due to untrusted event");
    throw new Error("Untrusted event");
  }
  if (entry != null && !devvit.entrypoints[entry])
    throw Error(`no entrypoint named "${entry}"; all entrypoints must appear in \`devvit.json\` \`post.entrypoints\``);
  let entryUrl;
  if (entry) {
    const url = new URL(devvit.entrypoints[entry]);
    if (url.pathname.startsWith(apiPathPrefix))
      url.searchParams.set(tokenParam, devvit.token);
    entryUrl = `${url}`;
  }
  emitEffect({
    type: EffectType.EFFECT_WEB_VIEW,
    immersiveMode: { entryUrl, immersiveMode: mode }
  });
}
function initWebViewMode() {
  addEventListener("message", onWebViewMessage);
}
function onWebViewMessage(ev) {
  if (ev.data?.type !== "devvit-message")
    return;
  if (!ev.data?.data?.immersiveModeEvent)
    return;
  const mode = getWebViewMode();
  for (const listener of modeListeners)
    listener(mode);
}
function webViewMode(mode) {
  switch (mode) {
    case WebViewImmersiveMode.IMMERSIVE_MODE:
      return "expanded";
    case WebViewImmersiveMode.INLINE_MODE:
    case WebViewImmersiveMode.UNRECOGNIZED:
    case WebViewImmersiveMode.UNSPECIFIED:
    case void 0:
      return "inline";
    default:
      mode;
      throw Error(`${mode} not a WebViewImmersiveMode`);
  }
}

// node_modules/@devvit/client/clientContext.js
var context = globalThis.devvit?.context;

// node_modules/@devvit/shared-types/thing-navigation.js
function resolveNavigationInput(thingOrUrl) {
  if (typeof thingOrUrl === "string") {
    return thingOrUrl;
  }
  const { url, permalink } = thingOrUrl;
  if (permalink === void 0) {
    return url;
  }
  try {
    if (new URL(url).pathname !== permalink) {
      return new URL(permalink, "https://www.reddit.com").toString();
    }
  } catch {
    return new URL(permalink, "https://www.reddit.com").toString();
  }
  return url;
}

// node_modules/@devvit/client/effects/navigate-to.js
function navigateTo(url) {
  const inputUrl = resolveNavigationInput(url);
  let normalizedUrl;
  try {
    normalizedUrl = new URL(inputUrl).toString();
  } catch {
    throw new TypeError(`Invalid URL: ${inputUrl}`);
  }
  void emitEffect({
    navigateToUrl: {
      url: normalizedUrl
    },
    type: 5
  });
}

// node_modules/@devvit/protos/json/reddit/devvit/app_permission/v1/app_permission.js
var ConsentStatus;
(function(ConsentStatus2) {
  ConsentStatus2[ConsentStatus2["CONSENT_STATUS_UNKNOWN"] = 0] = "CONSENT_STATUS_UNKNOWN";
  ConsentStatus2[ConsentStatus2["REVOKED"] = 1] = "REVOKED";
  ConsentStatus2[ConsentStatus2["GRANTED"] = 2] = "GRANTED";
  ConsentStatus2[ConsentStatus2["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
})(ConsentStatus || (ConsentStatus = {}));
var Scope;
(function(Scope2) {
  Scope2[Scope2["SCOPE_UNKNOWN"] = 0] = "SCOPE_UNKNOWN";
  Scope2[Scope2["SUBMIT_POST"] = 1] = "SUBMIT_POST";
  Scope2[Scope2["SUBMIT_COMMENT"] = 2] = "SUBMIT_COMMENT";
  Scope2[Scope2["SUBSCRIBE_TO_SUBREDDIT"] = 3] = "SUBSCRIBE_TO_SUBREDDIT";
  Scope2[Scope2["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
})(Scope || (Scope = {}));

// node_modules/@devvit/protos/json/devvit/ui/effects/web_view/v1alpha/context.js
var Client;
(function(Client2) {
  Client2[Client2["CLIENT_UNSPECIFIED"] = 0] = "CLIENT_UNSPECIFIED";
  Client2[Client2["ANDROID"] = 1] = "ANDROID";
  Client2[Client2["IOS"] = 2] = "IOS";
  Client2[Client2["SHREDDIT"] = 3] = "SHREDDIT";
  Client2[Client2["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
})(Client || (Client = {}));
var Height;
(function(Height2) {
  Height2[Height2["HEIGHT_UNSPECIFIED"] = 0] = "HEIGHT_UNSPECIFIED";
  Height2[Height2["REGULAR"] = 1] = "REGULAR";
  Height2[Height2["TALL"] = 2] = "TALL";
  Height2[Height2["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
})(Height || (Height = {}));

// node_modules/@devvit/shared-types/tid.js
var T_PREFIX;
(function(T_PREFIX2) {
  T_PREFIX2["COMMENT"] = "t1_";
  T_PREFIX2["ACCOUNT"] = "t2_";
  T_PREFIX2["LINK"] = "t3_";
  T_PREFIX2["MESSAGE"] = "t4_";
  T_PREFIX2["SUBREDDIT"] = "t5_";
  T_PREFIX2["AWARD"] = "t6_";
})(T_PREFIX || (T_PREFIX = {}));

// node_modules/@devvit/shared-types/web-view-scripts-constants.js
var devvitScriptFileName = "devvit.v1.min.js";
var devvitScriptUrl = `https://webview.devvit.net/scripts/${devvitScriptFileName}`;

// node_modules/jwt-decode/build/esm/index.js
var InvalidTokenError = class extends Error {
};
InvalidTokenError.prototype.name = "InvalidTokenError";

// node_modules/@devvit/protos/json/devvit/ui/form_builder/v1alpha/type.js
var FormFieldType;
(function(FormFieldType2) {
  FormFieldType2[FormFieldType2["STRING"] = 0] = "STRING";
  FormFieldType2[FormFieldType2["PARAGRAPH"] = 1] = "PARAGRAPH";
  FormFieldType2[FormFieldType2["NUMBER"] = 2] = "NUMBER";
  FormFieldType2[FormFieldType2["BOOLEAN"] = 3] = "BOOLEAN";
  FormFieldType2[FormFieldType2["LIST"] = 4] = "LIST";
  FormFieldType2[FormFieldType2["SELECTION"] = 5] = "SELECTION";
  FormFieldType2[FormFieldType2["GROUP"] = 6] = "GROUP";
  FormFieldType2[FormFieldType2["IMAGE"] = 7] = "IMAGE";
  FormFieldType2[FormFieldType2["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
})(FormFieldType || (FormFieldType = {}));

// node_modules/@devvit/protos/json/devvit/events/v1alpha/events.js
var EventSource;
(function(EventSource2) {
  EventSource2[EventSource2["UNKNOWN_EVENT_SOURCE"] = 0] = "UNKNOWN_EVENT_SOURCE";
  EventSource2[EventSource2["USER"] = 1] = "USER";
  EventSource2[EventSource2["ADMIN"] = 2] = "ADMIN";
  EventSource2[EventSource2["MODERATOR"] = 3] = "MODERATOR";
  EventSource2[EventSource2["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
})(EventSource || (EventSource = {}));
var DeletionReason;
(function(DeletionReason2) {
  DeletionReason2[DeletionReason2["UNSPECIFIED_DELETION_REASON"] = 0] = "UNSPECIFIED_DELETION_REASON";
  DeletionReason2[DeletionReason2["SPAM"] = 1] = "SPAM";
  DeletionReason2[DeletionReason2["LEGAL"] = 2] = "LEGAL";
  DeletionReason2[DeletionReason2["OTHER"] = 3] = "OTHER";
  DeletionReason2[DeletionReason2["UNKNOWN"] = 4] = "UNKNOWN";
  DeletionReason2[DeletionReason2["EXPLICIT_CONTENT"] = 5] = "EXPLICIT_CONTENT";
  DeletionReason2[DeletionReason2["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
})(DeletionReason || (DeletionReason = {}));

// node_modules/@devvit/protos/json/devvit/reddit/v2alpha/postv2.js
var CrowdControlLevel;
(function(CrowdControlLevel2) {
  CrowdControlLevel2[CrowdControlLevel2["OFF"] = 0] = "OFF";
  CrowdControlLevel2[CrowdControlLevel2["LENIENT"] = 1] = "LENIENT";
  CrowdControlLevel2[CrowdControlLevel2["MEDIUM"] = 2] = "MEDIUM";
  CrowdControlLevel2[CrowdControlLevel2["STRICT"] = 3] = "STRICT";
  CrowdControlLevel2[CrowdControlLevel2["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
})(CrowdControlLevel || (CrowdControlLevel = {}));
var DistinguishType;
(function(DistinguishType2) {
  DistinguishType2[DistinguishType2["NULL_VALUE"] = 0] = "NULL_VALUE";
  DistinguishType2[DistinguishType2["ADMIN"] = 1] = "ADMIN";
  DistinguishType2[DistinguishType2["GOLD"] = 2] = "GOLD";
  DistinguishType2[DistinguishType2["GOLD_AUTO"] = 3] = "GOLD_AUTO";
  DistinguishType2[DistinguishType2["YES"] = 4] = "YES";
  DistinguishType2[DistinguishType2["SPECIAL"] = 5] = "SPECIAL";
  DistinguishType2[DistinguishType2["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
})(DistinguishType || (DistinguishType = {}));

// node_modules/@devvit/protos/json/devvit/reddit/v2alpha/subredditv2.js
var SubredditType;
(function(SubredditType2) {
  SubredditType2[SubredditType2["ARCHIVED"] = 0] = "ARCHIVED";
  SubredditType2[SubredditType2["EMPLOYEES_ONLY"] = 1] = "EMPLOYEES_ONLY";
  SubredditType2[SubredditType2["GOLD_ONLY"] = 2] = "GOLD_ONLY";
  SubredditType2[SubredditType2["GOLD_RESTRICTED"] = 3] = "GOLD_RESTRICTED";
  SubredditType2[SubredditType2["PRIVATE"] = 4] = "PRIVATE";
  SubredditType2[SubredditType2["PUBLIC"] = 5] = "PUBLIC";
  SubredditType2[SubredditType2["RESTRICTED"] = 6] = "RESTRICTED";
  SubredditType2[SubredditType2["USER"] = 7] = "USER";
  SubredditType2[SubredditType2["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
})(SubredditType || (SubredditType = {}));
var SubredditRating;
(function(SubredditRating2) {
  SubredditRating2[SubredditRating2["UNKNOWN_SUBREDDIT_RATING"] = 0] = "UNKNOWN_SUBREDDIT_RATING";
  SubredditRating2[SubredditRating2["E"] = 1] = "E";
  SubredditRating2[SubredditRating2["M1"] = 2] = "M1";
  SubredditRating2[SubredditRating2["M2"] = 3] = "M2";
  SubredditRating2[SubredditRating2["D"] = 4] = "D";
  SubredditRating2[SubredditRating2["V"] = 5] = "V";
  SubredditRating2[SubredditRating2["X"] = 6] = "X";
  SubredditRating2[SubredditRating2["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
})(SubredditRating || (SubredditRating = {}));
var SubredditTypeV2;
(function(SubredditTypeV22) {
  SubredditTypeV22[SubredditTypeV22["SUBREDDIT_TYPE_UNSPECIFIED"] = 0] = "SUBREDDIT_TYPE_UNSPECIFIED";
  SubredditTypeV22[SubredditTypeV22["SUBREDDIT_TYPE_UNKNOWN"] = 1] = "SUBREDDIT_TYPE_UNKNOWN";
  SubredditTypeV22[SubredditTypeV22["SUBREDDIT_TYPE_ARCHIVED"] = 2] = "SUBREDDIT_TYPE_ARCHIVED";
  SubredditTypeV22[SubredditTypeV22["SUBREDDIT_TYPE_EMPLOYEES_ONLY"] = 3] = "SUBREDDIT_TYPE_EMPLOYEES_ONLY";
  SubredditTypeV22[SubredditTypeV22["SUBREDDIT_TYPE_GOLD_ONLY"] = 4] = "SUBREDDIT_TYPE_GOLD_ONLY";
  SubredditTypeV22[SubredditTypeV22["SUBREDDIT_TYPE_GOLD_RESTRICTED"] = 5] = "SUBREDDIT_TYPE_GOLD_RESTRICTED";
  SubredditTypeV22[SubredditTypeV22["SUBREDDIT_TYPE_PRIVATE"] = 6] = "SUBREDDIT_TYPE_PRIVATE";
  SubredditTypeV22[SubredditTypeV22["SUBREDDIT_TYPE_PUBLIC"] = 7] = "SUBREDDIT_TYPE_PUBLIC";
  SubredditTypeV22[SubredditTypeV22["SUBREDDIT_TYPE_RESTRICTED"] = 8] = "SUBREDDIT_TYPE_RESTRICTED";
  SubredditTypeV22[SubredditTypeV22["SUBREDDIT_TYPE_USER"] = 9] = "SUBREDDIT_TYPE_USER";
  SubredditTypeV22[SubredditTypeV22["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
})(SubredditTypeV2 || (SubredditTypeV2 = {}));
var SubredditRatingV2;
(function(SubredditRatingV22) {
  SubredditRatingV22[SubredditRatingV22["SUBREDDIT_RATING_UNSPECIFIED"] = 0] = "SUBREDDIT_RATING_UNSPECIFIED";
  SubredditRatingV22[SubredditRatingV22["SUBREDDIT_RATING_UNKNOWN"] = 1] = "SUBREDDIT_RATING_UNKNOWN";
  SubredditRatingV22[SubredditRatingV22["SUBREDDIT_RATING_E"] = 2] = "SUBREDDIT_RATING_E";
  SubredditRatingV22[SubredditRatingV22["SUBREDDIT_RATING_M1"] = 3] = "SUBREDDIT_RATING_M1";
  SubredditRatingV22[SubredditRatingV22["SUBREDDIT_RATING_M2"] = 4] = "SUBREDDIT_RATING_M2";
  SubredditRatingV22[SubredditRatingV22["SUBREDDIT_RATING_D"] = 5] = "SUBREDDIT_RATING_D";
  SubredditRatingV22[SubredditRatingV22["SUBREDDIT_RATING_V"] = 6] = "SUBREDDIT_RATING_V";
  SubredditRatingV22[SubredditRatingV22["SUBREDDIT_RATING_X"] = 7] = "SUBREDDIT_RATING_X";
  SubredditRatingV22[SubredditRatingV22["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
})(SubredditRatingV2 || (SubredditRatingV2 = {}));

// node_modules/@devvit/shared-types/shared/form.js
var SettingScope;
(function(SettingScope2) {
  SettingScope2["Installation"] = "installation";
  SettingScope2["App"] = "app";
})(SettingScope || (SettingScope = {}));

// node_modules/@devvit/client/index.js
initWebViewMode();

// node_modules/@devvit/protos/json/devvit/ui/effect_types/v1alpha/create_order.js
var OrderResultStatus;
(function(OrderResultStatus2) {
  OrderResultStatus2[OrderResultStatus2["STATUS_CANCELLED"] = 0] = "STATUS_CANCELLED";
  OrderResultStatus2[OrderResultStatus2["STATUS_SUCCESS"] = 1] = "STATUS_SUCCESS";
  OrderResultStatus2[OrderResultStatus2["STATUS_ERROR"] = 2] = "STATUS_ERROR";
  OrderResultStatus2[OrderResultStatus2["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
})(OrderResultStatus || (OrderResultStatus = {}));

// node_modules/@devvit/protos/json/devvit/ui/effects/v1alpha/realtime_subscriptions.js
var RealtimeSubscriptionStatus;
(function(RealtimeSubscriptionStatus2) {
  RealtimeSubscriptionStatus2[RealtimeSubscriptionStatus2["REALTIME_SUBSCRIBED"] = 0] = "REALTIME_SUBSCRIBED";
  RealtimeSubscriptionStatus2[RealtimeSubscriptionStatus2["REALTIME_UNSUBSCRIBED"] = 1] = "REALTIME_UNSUBSCRIBED";
  RealtimeSubscriptionStatus2[RealtimeSubscriptionStatus2["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
})(RealtimeSubscriptionStatus || (RealtimeSubscriptionStatus = {}));

// src/client/app.ts
var isPostponedName = (n) => n === "STATUS_POSTPONED" || n === "STATUS_CANCELED";
var eventId = null;
var pollInterval = null;
var lastRenderSig = "";
var firstRender = true;
var finalPollsDone = 0;
var lastSummary = null;
var lastGame = null;
var postgameNotificationFired = false;
var postType = null;
var gameIsTerminal = false;
var fieldBuilt = false;
function isDebugEnabled() {
  try {
    const v = (new URLSearchParams(location.search).get("debug") || "").toLowerCase();
    if (v === "1" || v === "true" || v === "yes") return true;
  } catch {
  }
  try {
    if (localStorage.getItem("nfl-scores-debug") === "1") return true;
  } catch {
  }
  return false;
}
var DEBUG_OVERLAY = isDebugEnabled();
function reportError(label, e) {
  console.error(`[${label}]`, e);
  if (!DEBUG_OVERLAY) return;
  let overlay = document.getElementById("error-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "error-overlay";
    overlay.style.cssText = "position:fixed;top:0;left:0;right:0;background:rgba(180,0,0,0.95);color:#fff;padding:8px 12px;font-family:monospace;font-size:10px;z-index:99999;max-height:40vh;overflow-y:auto;border-bottom:2px solid #fff;line-height:1.4;white-space:pre-wrap;word-break:break-word;";
    overlay.onclick = () => overlay.remove();
    document.body.appendChild(overlay);
  }
  const msg = e instanceof Error ? `${e.message}
${e.stack || ""}` : String(e);
  const line = document.createElement("div");
  line.style.cssText = "padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.2);";
  line.textContent = `[${label}] ${msg}`;
  overlay.appendChild(line);
}
window.addEventListener("error", (e) => reportError("window.error", e.error || e.message));
window.addEventListener("unhandledrejection", (e) => reportError("unhandled promise", e.reason));
var $ = (id) => document.getElementById(id);
function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function logoHtml(team, sizeClass) {
  const badge = `<span class="logo-badge">${escapeHtml(team.abbr || "?")}</span>`;
  if (!team.id) return badge;
  const local = `/teams/${encodeURIComponent(team.id)}.png`;
  const cdn = escapeHtml(team.logo ? proxied(team.logo) : cdnLogo(team));
  const badgeAttr = badge.replace(/"/g, "&quot;");
  const onerr = cdn ? `if(!this.dataset.f){this.dataset.f=1;this.src='${cdn}';}else{this.outerHTML='${badgeAttr}';}` : `this.outerHTML='${badgeAttr}';`;
  return `<img class="${sizeClass}" src="${local}" alt="${escapeHtml(team.abbr)}" onerror="${onerr}">`;
}
function setLogoHolder(id, team, sizeClass) {
  const el = $(id);
  if (el) el.innerHTML = logoHtml(team, sizeClass);
}
function formatGameTime(gameDate) {
  const d = new Date(gameDate);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}
function periodLabel(p) {
  if (p <= 0) return "";
  if (p <= 4) return ["", "1ST", "2ND", "3RD", "4TH"][p];
  return "OT" + (p > 5 ? String(p - 4) : "");
}
function hideAllStatePanes() {
  ["pregame-content", "live-content", "final-content", "postponed-content"].forEach((id) => {
    const el = $(id);
    if (el) el.style.display = "none";
  });
}
var EXPAND_ICON = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>';
function isExpandedMode() {
  try {
    return getWebViewMode() === "expanded";
  } catch {
    return false;
  }
}
var pagerScrollWired = /* @__PURE__ */ new WeakSet();
var pagerRaf = 0;
function scheduleInlinePagerSync() {
  if (pagerRaf) return;
  pagerRaf = requestAnimationFrame(() => {
    pagerRaf = 0;
    updateInlinePager();
  });
}
function inlinePagerRegion() {
  return document.querySelector(".tab-content.tab-content-active");
}
function syncPagerAfterAnimation() {
  scheduleInlinePagerSync();
  [80, 180, 280, 420].forEach((ms) => window.setTimeout(scheduleInlinePagerSync, ms));
}
function updateInlinePager() {
  const pager = document.getElementById("inline-pager");
  if (!pager) return;
  const inline = document.body.classList.contains("is-inline");
  const region = inline ? inlinePagerRegion() : null;
  const needed = !!region && region.scrollHeight > region.clientHeight + 2;
  pager.classList.toggle("pager-active", inline && needed);
  if (!needed || !region) return;
  const bar = document.querySelector(".tab-bar");
  pager.style.bottom = (bar ? bar.offsetHeight : 56) + 10 + "px";
  const up = document.getElementById("inline-pager-up");
  const down = document.getElementById("inline-pager-down");
  if (up) up.disabled = region.scrollTop <= 1;
  if (down) down.disabled = region.scrollTop >= region.scrollHeight - region.clientHeight - 1;
  if (!pagerScrollWired.has(region)) {
    region.addEventListener("scroll", scheduleInlinePagerSync, { passive: true });
    pagerScrollWired.add(region);
  }
}
function setupInlinePager() {
  const host = $("scorebug-content");
  if (!host || document.getElementById("inline-pager")) return;
  const chev = (d) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="' + d + '"/></svg>';
  const pager = document.createElement("div");
  pager.id = "inline-pager";
  const mk = (id, label, path, dir) => {
    const b = document.createElement("button");
    b.id = id;
    b.type = "button";
    b.className = "inline-pager-btn";
    b.setAttribute("aria-label", label);
    b.innerHTML = chev(path);
    b.addEventListener("click", () => {
      const region = inlinePagerRegion();
      if (!region) return;
      region.scrollBy({ top: dir * Math.round(region.clientHeight * 0.8), behavior: "smooth" });
    });
    return b;
  };
  pager.appendChild(mk("inline-pager-up", "Scroll up", "M18 15l-6-6-6 6", -1));
  pager.appendChild(mk("inline-pager-down", "Scroll down", "M6 9l6 6 6-6", 1));
  host.appendChild(pager);
  const obs = new MutationObserver(scheduleInlinePagerSync);
  obs.observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"] });
  window.addEventListener("resize", scheduleInlinePagerSync);
  host.addEventListener("transitionend", (e) => {
    const p = e.propertyName;
    if (p === "grid-template-rows" || p === "max-height" || p === "height") scheduleInlinePagerSync();
  });
  updateInlinePager();
}
function setupExpand() {
  if (document.getElementById("expand-btn")) return;
  const host = $("scorebug-content") || document.body;
  const btn = document.createElement("button");
  btn.id = "expand-btn";
  btn.type = "button";
  btn.setAttribute("aria-label", "Open full screen");
  btn.innerHTML = EXPAND_ICON;
  btn.style.cssText = "position:absolute;top:10px;right:12px;z-index:40;width:25px;height:25px;display:flex;align-items:center;justify-content:center;padding:0;background:rgba(255,255,255,0.14);color:#fff;border:1px solid rgba(255,255,255,0.3);border-radius:6px;cursor:pointer;-webkit-tap-highlight-color:transparent;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);";
  let modePoll = 0;
  const sync = () => {
    const expanded = isExpandedMode();
    btn.style.display = expanded ? "none" : "flex";
    document.body.classList.toggle("is-inline", !expanded);
    document.body.classList.toggle("is-expanded", expanded);
    scheduleInlinePagerSync();
    if (expanded && !modePoll) {
      modePoll = window.setInterval(sync, 400);
    } else if (!expanded && modePoll) {
      window.clearInterval(modePoll);
      modePoll = 0;
    }
  };
  sync();
  window.addEventListener("resize", sync);
  document.addEventListener("visibilitychange", sync);
  btn.addEventListener("click", (event) => {
    if (isExpandedMode()) {
      sync();
      return;
    }
    try {
      requestExpandedMode(event, "default");
    } catch (e) {
      reportError("requestExpandedMode", e);
    }
    let tries = 0;
    const settle = window.setInterval(() => {
      tries++;
      sync();
      if (isExpandedMode() || tries > 20) window.clearInterval(settle);
    }, 100);
  });
  host.appendChild(btn);
}
var SUN_ICON = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
var MOON_ICON = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
var THEME_KEY = "nfl-scores-theme";
function applyTheme(theme) {
  if (theme === "light") document.documentElement.setAttribute("data-theme", "light");
  else document.documentElement.removeAttribute("data-theme");
}
function savedTheme() {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}
function resolveTheme() {
  return savedTheme() ?? "light";
}
function setupThemeToggle() {
  if (document.getElementById("theme-btn")) return;
  const host = $("scorebug-content") || document.body;
  let theme = resolveTheme();
  applyTheme(theme);
  const btn = document.createElement("button");
  btn.id = "theme-btn";
  btn.type = "button";
  btn.style.cssText = "position:absolute;top:10px;left:12px;z-index:40;width:25px;height:25px;display:flex;align-items:center;justify-content:center;padding:0;background:rgba(255,255,255,0.14);color:#fff;border:1px solid rgba(255,255,255,0.3);border-radius:6px;cursor:pointer;-webkit-tap-highlight-color:transparent;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);";
  const paint = () => {
    btn.innerHTML = theme === "light" ? MOON_ICON : SUN_ICON;
    btn.setAttribute("aria-label", theme === "light" ? "Switch to dark mode" : "Switch to light mode");
  };
  paint();
  btn.addEventListener("click", () => {
    theme = theme === "light" ? "dark" : "light";
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
    }
    paint();
    try {
      if (lastSummary) render(lastSummary);
    } catch (e) {
      reportError("theme re-render", e);
    }
  });
  host.appendChild(btn);
}
var GRAPH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18 L9 12 L13 16 L21 6"/><polyline points="15 6 21 6 21 12"/></svg>';
var TV_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="13" rx="2"/><path d="M8 3l4 4 4-4"/></svg>';
var FEED_TV_ICON = TV_ICON;
var FEED_RADIO_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="14" r="2.5"/><path d="M4.9 9.9a10 10 0 0 1 14.2 0"/><path d="M7.8 12.8a6 6 0 0 1 8.4 0"/></svg>';
var OVERLAY_CLOSE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
var infoOverlayEl = null;
function overlayRowsHtml(items) {
  return items.map((it, i) => {
    const visual = it.img ? `<img class="info-row-logo" src="${proxied(it.img)}" alt="">` : it.icon ? `<span class="info-row-icon">${it.icon}</span>` : "";
    const inner = visual + '<span class="info-row-text"><span class="info-row-label">' + it.label + "</span>" + (it.sub ? '<span class="info-row-sub">' + it.sub + "</span>" : "") + "</span>";
    const style = `animation-delay:${50 + i * 55}ms`;
    return it.url ? `<button class="info-row" type="button" data-url="${it.url}" style="${style}">${inner}</button>` : `<div class="info-row is-static" style="${style}">${inner}</div>`;
  }).join("");
}
function wireOverlayRows(ov) {
  ov.querySelectorAll(".info-row[data-url]").forEach((row) => {
    row.addEventListener("click", () => {
      const url = row.getAttribute("data-url");
      if (!url) return;
      try {
        navigateTo(url);
      } catch (e) {
        reportError("navigateTo", e);
      }
    });
  });
  ov.querySelectorAll(".info-row-logo").forEach((img) => {
    img.addEventListener("error", () => {
      img.style.display = "none";
    });
  });
}
function closeInfoOverlay() {
  const ov = infoOverlayEl;
  if (!ov) return;
  ov.classList.remove("is-open");
  window.setTimeout(() => {
    if (ov && !ov.classList.contains("is-open")) ov.style.display = "none";
  }, 220);
}
function openInfoOverlay(title, items) {
  const host = $("scorebug-content") || document.body;
  let ov = infoOverlayEl;
  if (!ov) {
    ov = document.createElement("div");
    ov.className = "info-overlay";
    ov.addEventListener("click", (e) => {
      if (e.target === ov) closeInfoOverlay();
    });
    host.appendChild(ov);
    infoOverlayEl = ov;
  }
  ov.innerHTML = '<div class="info-panel"><div class="info-panel-head"><span class="info-panel-title">' + title + '</span><button class="info-panel-close" type="button" aria-label="Close">' + OVERLAY_CLOSE_ICON + '</button></div><div class="info-panel-body">' + overlayRowsHtml(items) + "</div></div>";
  ov.querySelector(".info-panel-close")?.addEventListener("click", closeInfoOverlay);
  wireOverlayRows(ov);
  ov.style.display = "flex";
  void ov.offsetWidth;
  ov.classList.add("is-open");
}
function setOverlayRows(items) {
  const ov = infoOverlayEl;
  if (!ov) return;
  const body = ov.querySelector(".info-panel-body");
  if (!body) return;
  body.innerHTML = overlayRowsHtml(items);
  wireOverlayRows(ov);
}
function mkTopMiniButton(id, label, icon, side, offsetPx) {
  const b = document.createElement("button");
  b.id = id;
  b.type = "button";
  b.className = "topbar-mini-btn";
  b.setAttribute("aria-label", label);
  b.innerHTML = icon;
  b.style.cssText = "position:absolute;top:10px;" + side + ":" + offsetPx + "px;z-index:40;width:25px;height:25px;display:flex;align-items:center;justify-content:center;padding:0;background:rgba(255,255,255,0.14);color:#fff;border:1px solid rgba(255,255,255,0.3);border-radius:6px;cursor:pointer;-webkit-tap-highlight-color:transparent;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);";
  return b;
}
function setupGraphButton() {
  if (document.getElementById("graph-btn")) return;
  const host = $("scorebug-content") || document.body;
  const btn = mkTopMiniButton("graph-btn", "Analytics links", GRAPH_ICON, "right", 44);
  btn.addEventListener("click", () => {
    if (eventId == null) return;
    openInfoOverlay("Analytics", [
      { label: "ESPN Gamecast", sub: "Official live game page", url: `https://www.espn.com/nfl/game/_/gameId/${eventId}` },
      { label: "NFL.com", sub: "League scoreboard", url: "https://www.nfl.com/scores/" },
      { label: "Pro-Football-Reference", sub: "Box scores (posts next day)", url: "https://www.pro-football-reference.com/boxscores/" },
      { label: "nflfastR / rbsdm", sub: "EPA + advanced model board", url: "https://rbsdm.com/stats/stats/" }
    ]);
  });
  host.appendChild(btn);
}
async function fetchBroadcastItems(id) {
  try {
    const res = await fetch(`/api/broadcasts/${id}`);
    if (!res.ok) return [{ label: "Broadcast info unavailable" }];
    const data = await res.json();
    const casts = data?.broadcasts || [];
    if (casts.length === 0) return [{ label: "No listed broadcasts" }];
    const seen = /* @__PURE__ */ new Set();
    const items = [];
    casts.forEach((b) => {
      const name = String(b?.media?.shortName || (Array.isArray(b?.names) ? b.names.join(", ") : "") || b?.station || "").trim();
      if (!name) return;
      const kind = String(b?.type?.shortName || b?.type || "").toUpperCase();
      const market = String(b?.market?.type || b?.market || "").replace(/^\w/, (c) => c.toUpperCase());
      const dedup = name + "|" + kind;
      if (seen.has(dedup)) return;
      seen.add(dedup);
      const isTv = !kind || kind.includes("TV") || kind.includes("WEB");
      items.push({ label: name, sub: [market, kind].filter(Boolean).join(" \xB7 "), icon: isTv ? FEED_TV_ICON : FEED_RADIO_ICON });
    });
    return items.length ? items : [{ label: "No listed broadcasts" }];
  } catch (e) {
    reportError("fetchBroadcastItems", e);
    return [{ label: "Broadcast info unavailable" }];
  }
}
function setupTvButton() {
  if (document.getElementById("tv-btn")) return;
  const host = $("scorebug-content") || document.body;
  const btn = mkTopMiniButton("tv-btn", "Where to watch", TV_ICON, "left", 44);
  btn.addEventListener("click", async () => {
    if (eventId == null) return;
    openInfoOverlay("Where to Watch", [{ label: "Loading\u2026" }]);
    const items = await fetchBroadcastItems(eventId);
    setOverlayRows(items);
  });
  host.appendChild(btn);
}
var NFL_COLORS = {
  "1": "#a71930",
  "2": "#00338d",
  "3": "#0b162a",
  "4": "#fb4f14",
  "5": "#311d00",
  "6": "#003594",
  "7": "#fb4f14",
  "8": "#0076b6",
  "9": "#203731",
  "10": "#0c2340",
  "11": "#002c5f",
  "12": "#e31837",
  "13": "#000000",
  "14": "#003594",
  "15": "#008e97",
  "16": "#4f2683",
  "17": "#002244",
  "18": "#d3bc8d",
  "19": "#0b2265",
  "20": "#125740",
  "21": "#004c54",
  "22": "#97233f",
  "23": "#101820",
  "24": "#0080c6",
  "25": "#aa0000",
  "26": "#002244",
  "27": "#d50a0a",
  "28": "#5a1414",
  "29": "#0085ca",
  "30": "#006778",
  "33": "#241773",
  "34": "#03202f"
};
var blobCache = /* @__PURE__ */ new Map();
function ghostSwap(img) {
  const span = document.createElement("span");
  span.className = `${img.className} ph`;
  img.replaceWith(span);
}
async function loadProxiedInto(img, url) {
  const cached = blobCache.get(url);
  if (cached) {
    img.src = cached;
    return;
  }
  try {
    const res = await fetch(url);
    if (!res.ok) {
      ghostSwap(img);
      return;
    }
    const blob = await res.blob();
    const obj = URL.createObjectURL(blob);
    blobCache.set(url, obj);
    img.src = obj;
  } catch {
    ghostSwap(img);
  }
}
function hydrateProxiedImages(root) {
  root.querySelectorAll("img[data-psrc]").forEach((img) => {
    const u = img.getAttribute("data-psrc");
    img.removeAttribute("data-psrc");
    if (u) void loadProxiedInto(img, u);
  });
}
window.__logoFb = (img) => {
  const step = Number(img.dataset.fb || "0");
  const id = img.dataset.tid || "";
  const abbr = img.dataset.tabbr || "";
  img.dataset.fb = String(step + 1);
  if (step === 0 && id) {
    img.src = `/teams/${encodeURIComponent(id)}.svg`;
    return;
  }
  if (step === 1 && abbr) {
    void loadProxiedInto(img, `/api/img?u=${encodeURIComponent(`https://a.espncdn.com/i/teamlogos/nfl/500/${abbr.toLowerCase()}.png`)}`);
    return;
  }
  img.style.display = "none";
};
function proxied(url) {
  const u = String(url || "").trim();
  if (!u || !/^https:\/\//i.test(u)) return u;
  return `/api/img?u=${encodeURIComponent(u)}`;
}
function cdnLogo(t) {
  return proxied(`https://a.espncdn.com/i/teamlogos/nfl/500/${encodeURIComponent(t.abbr.toLowerCase())}.png`);
}
var TEAM_COLORS_DUAL = {
  "1": ["#a71930", "#a71930"],
  // ATL red
  "2": ["#c60c30", "#c60c30"],
  // BUF: royal blue -> charging red
  "3": ["#e64100", "#c83803"],
  // CHI: navy -> orange
  "4": ["#fb4f14", "#fb4f14"],
  // CIN orange
  "5": ["#ff3c00", "#311d00"],
  // CLE: orange bright in dark, brown in light
  "6": ["#b0b7bc", "#7f9695"],
  // DAL: navy -> silver
  "7": ["#fb4f14", "#fb4f14"],
  // DEN orange
  "8": ["#0076b6", "#0076b6"],
  // DET Honolulu blue (allowed)
  "9": ["#ffb612", "#203731"],
  // GB: gold in dark, forest in light
  "10": ["#4b92db", "#4b92db"],
  // TEN light blue (allowed)
  "11": ["#a2aaad", "#6b7a86"],
  // IND: royal blue -> grey
  "12": ["#e31837", "#e31837"],
  // KC red
  "13": ["#c4c9cc", "#101820"],
  // LV: silver in dark, black in light
  "14": ["#ffa300", "#ffa300"],
  // LAR: royal -> sol gold
  "15": ["#008e97", "#008e97"],
  // MIA aqua
  "16": ["#4f2683", "#4f2683"],
  // MIN purple
  "17": ["#c60c30", "#c60c30"],
  // NE: navy -> red
  "18": ["#d3bc8d", "#9f8958"],
  // NO gold
  "19": ["#a71930", "#a71930"],
  // NYG: royal blue -> red
  "20": ["#1f8a5f", "#125740"],
  // NYJ green (brighter in dark)
  "21": ["#3d8f8f", "#004c54"],
  // PHI midnight green (brighter in dark)
  "22": ["#97233f", "#97233f"],
  // ARI cardinal
  "23": ["#ffb612", "#ffb612"],
  // PIT gold
  "24": ["#0080c6", "#0080c6"],
  // LAC powder blue (allowed)
  "25": ["#aa0000", "#aa0000"],
  // SF red
  "26": ["#69be28", "#69be28"],
  // SEA: navy -> action green
  "27": ["#d50a0a", "#d50a0a"],
  // TB red
  "28": ["#8a2b2b", "#5a1414"],
  // WSH burgundy (brighter in dark)
  "29": ["#9aa2a9", "#101820"],
  // CAR: process blue -> silver/black
  "30": ["#00838f", "#006778"],
  // JAX teal
  "33": ["#6e56cf", "#241773"],
  // BAL purple (brighter in dark)
  "34": ["#c41e3a", "#c41e3a"]
  // HOU: deep steel -> battle red
};
function statInkOf(t, fallback) {
  const theme = document.documentElement.getAttribute("data-theme");
  if (theme !== "light") return railColorOf(t, fallback);
  const hex = (t.color || "").replace(/^#?/, "#");
  if (/^#[0-9a-f]{6}$/i.test(hex)) {
    const r = parseInt(hex.slice(1, 3), 16), gr = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    const lum = 0.2126 * r + 0.7152 * gr + 0.0722 * b;
    if (lum < 150) return hex;
  }
  return "#0d1f38";
}
function railColorOf(t, fallback) {
  const dual = TEAM_COLORS_DUAL[t.id];
  if (dual) {
    const light = document.documentElement.getAttribute("data-theme") === "light";
    return dual[light ? 1 : 0];
  }
  return teamColorOf(t, fallback);
}
function teamColorOf(t, fallback) {
  return t.color || NFL_COLORS[t.id] || fallback;
}
function recordOf(c) {
  const rec = c?.record;
  if (Array.isArray(rec)) {
    for (const r of rec) if (r && (r.type === "total" || !r.type) && r.summary) return String(r.summary);
    return rec[0]?.summary ? String(rec[0].summary) : "";
  }
  return rec ? String(rec) : "";
}
function normTeam(c) {
  const t = c?.team || {};
  const logos = t.logos || [];
  const lines = (c?.linescores || []).map((l) => Number(l?.displayValue ?? l?.value ?? 0) || 0);
  return {
    id: String(t.id ?? ""),
    name: String(t.displayName ?? ""),
    nick: String(t.name ?? t.shortDisplayName ?? t.displayName ?? ""),
    abbr: String(t.abbreviation ?? ""),
    score: Number(c?.score ?? 0) || 0,
    // ESPN scores are strings
    record: recordOf(c),
    logo: logos[0]?.href ? String(logos[0].href) : "",
    color: t.color ? "#" + String(t.color).replace(/^#/, "") : "",
    linescores: lines
  };
}
function normalize(summary) {
  const header = summary?.header;
  const comp = header?.competitions?.[0];
  if (!comp) return null;
  const competitors = comp.competitors || [];
  const home = competitors.find((c) => c?.homeAway === "home");
  const away = competitors.find((c) => c?.homeAway === "away");
  if (!home || !away) return null;
  const st = comp.status?.type || {};
  return {
    eventId: String(header.id ?? ""),
    date: String(comp.date ?? ""),
    seasonType: Number(header.season?.type) || 2,
    week: header.week?.number != null ? Number(header.week.number) : typeof header.week === "number" ? header.week : null,
    statusName: String(st.name ?? ""),
    phase: st.state === "pre" || st.state === "in" || st.state === "post" ? st.state : "pre",
    completed: st.completed === true,
    statusDetail: String(st.detail ?? st.description ?? ""),
    displayClock: String(comp.status?.displayClock ?? ""),
    period: Number(comp.status?.period) || 0,
    home: normTeam(home),
    away: normTeam(away),
    homePossession: home.possession === true,
    awayPossession: away.possession === true,
    broadcasts: comp.broadcasts || [],
    venue: summary?.gameInfo?.venue || null
  };
}
function lastPlayOf(summary) {
  const cur = summary?.drives?.current;
  if (cur?.plays?.length) return cur.plays[cur.plays.length - 1];
  const prev = summary?.drives?.previous;
  if (prev?.length) {
    const d = prev[prev.length - 1];
    if (d?.plays?.length) return d.plays[d.plays.length - 1];
  }
  return null;
}
function numOrNull(v) {
  const n = Number(v);
  return isFinite(n) && v != null ? n : null;
}
function fmtDD(down, dist) {
  if (down == null) return "";
  const o = ["", "1st", "2nd", "3rd", "4th"][down] || down + "th";
  return `${o} & ${dist == null ? "\u2014" : dist === 0 ? "Goal" : dist}`;
}
function parseSituation(summary, g) {
  const sit = summary?.situation;
  const play = lastPlayOf(summary);
  const end = play?.end;
  let down = null, distance = null, yardsToEndzone = null;
  let ddText = "", possText = "", possTeamId = "";
  if (sit) {
    down = numOrNull(sit.down);
    distance = numOrNull(sit.distance);
    yardsToEndzone = numOrNull(sit.yardsToEndzone != null ? sit.yardsToEndzone : sit.yardLine);
    ddText = String(sit.shortDownDistanceText || sit.downDistanceText || "").replace(/\s+at\s+.*$/i, "");
    possText = String(sit.possessionText || "");
    possTeamId = sit.possession != null ? String(sit.possession) : "";
  } else if (end) {
    down = numOrNull(end.down);
    distance = numOrNull(end.distance);
    yardsToEndzone = numOrNull(end.yardsToEndzone);
    ddText = String(end.shortDownDistanceText || end.downDistanceText || "").replace(/\s+at\s+.*$/i, "");
    possText = String(end.possessionText || "");
    possTeamId = end.team?.id != null ? String(end.team.id) : "";
  }
  const driveTeamId = summary?.drives?.current?.team?.id != null ? String(summary.drives.current.team.id) : "";
  if (driveTeamId) possTeamId = driveTeamId;
  {
    const drive0 = summary?.drives?.current;
    const plays0 = drive0?.plays || [];
    for (let i = plays0.length - 1; i >= 0; i--) {
      const p0 = plays0[i];
      if (ADMIN_PLAY.test(String(p0?.type?.text || ""))) continue;
      if (CHANGE_POSS.test(String(p0?.type?.text || ""))) {
        const endId = p0?.end?.team?.id != null ? String(p0.end.team.id) : "";
        if (endId && endId !== possTeamId && (endId === g.home.id || endId === g.away.id)) {
          possTeamId = endId;
        } else if (!endId && possTeamId) {
          possTeamId = possTeamId === g.home.id ? g.away.id : g.home.id;
        }
      }
      break;
    }
  }
  if (!possTeamId) {
    if (g.homePossession) possTeamId = g.home.id;
    else if (g.awayPossession) possTeamId = g.away.id;
  }
  if (down == null && !ddText) return null;
  return {
    down,
    distance,
    yardsToEndzone,
    ddText: ddText || fmtDD(down, distance),
    possText,
    possIsHome: !!possTeamId && possTeamId === g.home.id,
    possIsAway: !!possTeamId && possTeamId === g.away.id,
    lastPlayText: play?.text ? String(play.text) : ""
  };
}
var FB = (() => {
  const T = 14, B = 92;
  return {
    T,
    B,
    S: B + 4,
    LANE: T + (B - T) * 0.53,
    LANE2: T + (B - T) * 0.72,
    W: 600,
    TX: 24,
    TW: 552
    // slightly straighter angle than ESPN's 30/540
  };
})();
var xB = (u) => u / 120 * FB.W;
var xT = (u) => FB.TX + u / 120 * FB.TW;
var LANE_F = (FB.B - FB.LANE) / (FB.B - FB.T);
var xLane = (u) => xB(u) + (xT(u) - xB(u)) * LANE_F;
var LANE2_F = (FB.B - FB.LANE2) / (FB.B - FB.T);
var xLane2 = (u) => xB(u) + (xT(u) - xB(u)) * LANE2_F;
var clampUnit = (u) => Math.max(10, Math.min(110, u));
var POSTS_SVG = '<path fill="#6c6e6f" d="M6,48.75s0-.75,2-.75,2,.75,2,.75v8.5s0,.75-2,.75-2-.75-2-.75v-8.5Z"/><path fill="#e2ce23" d="M13,43c-2.21,0-4,1.79-4,4v2s0,.4-1,.4-1-.4-1-.4v-2c0-3.31,2.69-6,6-6h1v2h-1Z"/><path fill="#e2ce23" d="M18,10.4v26.6c0,.18-.05.36-.14.51l-6,10c-.23.39-.69.57-1.12.45-.43-.12-.73-.51-.73-.96v-30.6s0-.4,1-.4,1,.4,1,.4v26.99l4-6.67V10.4s0-.4,1-.4,1,.4,1,.4Z"/><rect fill="#e2ce23" x="11" y="42" width="2" height="2"/><path fill="#e2ce23" d="M 9.7 16.6 s 0 -0.42 0.83 -0.42 s 0.83 0.42 0.83 0.42 v 27 l -1.82 0"/><path fill="#6c6e6f" d="M594,57.25s0,.75-2,.75-2-.75-2-.75v-8.5s0-.75,2-.75,2,.75,2,.75v8.5Z"/><path fill="#e2ce23" d="M586,43v-2h1c3.31,0,6,2.69,6,6v2s0,.4-1,.4-1-.4-1-.4v-2c0-2.21-1.79-4-4-4h-1Z"/><path fill="#e2ce23" d="M583,10c1,0,1,.4,1,.4v26.32s4,6.67,4,6.67v-26.99s0-.4,1-.4,1,.4,1,.4v30.6c0,.45-.3.84-.73.96-.43.12-.89-.06-1.12-.45l-6-10c-.09-.16-.14-.33-.14-.51V10.4s0-.4,1-.4Z"/><rect fill="#e2ce23" x="587" y="42" width="2" height="2"/><path fill="#e2ce23" d="M 588.5 16.6 s 0 -0.42 0.83 -0.42 s 0.83 0.42 0.83 0.42 v 27 l -1.82 0"/>';
function bandPoly(u1, u2, cls, fill) {
  const pts = `${xB(u2)} ${FB.B} ${xB(u1)} ${FB.B} ${xT(u1)} ${FB.T} ${xT(u2)} ${FB.T}`;
  return `<polygon class="${cls}" points="${pts}"${fill ? ` fill="${fill}"` : ""}/>`;
}
function sideRect(u1, u2, cls, fill) {
  return `<rect class="${cls}" x="${xB(u1)}" y="${FB.B}" width="${xB(u2) - xB(u1)}" height="${FB.S - FB.B}"${fill ? ` fill="${fill}"` : ""}/>`;
}
function yardLine(u, wide = false) {
  return `<line class="fv-tenline" x1="${xT(u)}" y1="${FB.T}" x2="${xB(u)}" y2="${FB.B}"${wide ? ' stroke-width="2"' : ""}/>`;
}
function ezNamePaths() {
  const lB = (xB(0) + xB(10)) / 2, lT = (xT(0) + xT(10)) / 2;
  const rB = (xB(110) + xB(120)) / 2, rT = (xT(110) + xT(120)) / 2;
  return `<path id="fv-ezpath-l" d="M ${lB} ${FB.B + 1} L ${lT} ${FB.T - 1}" fill="none"/><path id="fv-ezpath-r" d="M ${rT} ${FB.T - 1} L ${rB} ${FB.B + 1}" fill="none"/>`;
}
function ezNameText(g, left) {
  const team = left ? g.away : g.home;
  const nick = (team.nick || team.abbr).toUpperCase();
  const USABLE = Math.hypot(27, FB.B - FB.T) * 0.82;
  const ADV = 0.47;
  const size = Math.max(9, Math.min(14, USABLE / (nick.length * ADV)));
  const est = nick.length * size * ADV;
  const clampAttr = est > USABLE - 1 ? ` textLength="${USABLE}" lengthAdjust="spacing"` : "";
  return `<text class="fv-ezname" font-size="${size.toFixed(1)}" dy="0.34em"><textPath href="#fv-ezpath-${left ? "l" : "r"}" startOffset="50%" text-anchor="middle"${clampAttr}>${escapeHtml(nick)}</textPath></text>`;
}
function buildFieldStatics(g) {
  const svg = $("field-svg");
  if (!svg) return;
  let s = "";
  for (let u = 10; u < 110; u += 10) {
    s += bandPoly(u, u + 10, u / 10 % 2 === 1 ? "fv-band" : "fv-band fv-band--dark");
  }
  s += bandPoly(0, 10, "fv-ez", g.away.color || "#5b6474");
  s += bandPoly(110, 120, "fv-ez", g.home.color || "#5b6474");
  for (let u = 10; u < 110; u += 10) {
    s += sideRect(u, u + 10, u / 10 % 2 === 1 ? "fv-band" : "fv-band fv-band--dark");
  }
  s += sideRect(0, 10, "fv-ez", g.away.color || "#5b6474");
  s += sideRect(110, 120, "fv-ez", g.home.color || "#5b6474");
  for (let u = 20; u <= 100; u += 10) s += yardLine(u, u === 60);
  s += `<line class="fv-edge" x1="0" y1="${FB.B}" x2="${FB.W}" y2="${FB.B}"/>`;
  s += `<defs><linearGradient id="fv-depth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(10,24,40,0)"/><stop offset="0.72" stop-color="rgba(10,24,40,0.02)"/><stop offset="1" stop-color="rgba(10,24,40,0.10)"/></linearGradient></defs>`;
  s += `<polygon fill="url(#fv-depth)" points="${xB(120)} ${FB.B} ${xB(0)} ${FB.B} ${xT(0)} ${FB.T} ${xT(120)} ${FB.T}"/>`;
  s += `<rect class="fv-sideoverlay" x="0" y="${FB.B}" width="${FB.W}" height="${FB.S - FB.B}"/>`;
  s += `<g transform="translate(0 ${FB.T - 26})">${POSTS_SVG}</g>`;
  s += ezNamePaths();
  s += ezNameText(g, true) + ezNameText(g, false);
  s += `<line id="fv-first" class="fv-first" x1="0" y1="${FB.T}" x2="0" y2="${FB.B}" style="display:none"/>`;
  s += `<g id="fv-drive"></g><g id="fv-play"></g><g id="fv-pin" style="display:none"></g><g id="fv-chip" style="display:none"></g>`;
  svg.innerHTML = s;
  const strip = $("yard-nums");
  if (strip) {
    strip.innerHTML = "";
    const put = (unit, text, minor) => {
      const sp = document.createElement("span");
      sp.textContent = text;
      sp.className = "fv-mark" + (minor ? " minor" : "");
      sp.style.left = (xB(unit) / FB.W * 100).toFixed(2) + "%";
      strip.appendChild(sp);
    };
    put(5, g.away.abbr, false);
    const nums = [
      [20, "10", true],
      [30, "20", false],
      [40, "30", true],
      [50, "40", true],
      [60, "50", false],
      [70, "40", true],
      [80, "30", true],
      [90, "20", false],
      [100, "10", true]
    ];
    nums.forEach(([u, t, minor]) => put(u, t, minor));
    put(115, g.home.abbr, false);
  }
}
var ADMIN_PLAY = /timeout|two-minute|end (period|of)/i;
var KICKOFF_PLAY = /kickoff/i;
var PUNT_PLAY = /punt/i;
var FG_PLAY = /field goal|extra point/i;
var INT_PLAY = /interception/i;
var AIR_PLAY = /pass|punt|kick|field goal|interception|reception/i;
var GROUND_OVERRIDE = /sack|kneel|rush|run/i;
var INCOMPLETE_PLAY = /incompletion|incomplete/i;
function playTypeText(p) {
  return String(p?.type?.text || p?.type?.abbreviation || "");
}
function isAdminPlay(p) {
  return ADMIN_PLAY.test(playTypeText(p));
}
function displayPlaysOf(drive) {
  const plays = drive?.plays || [];
  const kept = plays.filter((p) => {
    if (isAdminPlay(p)) return false;
    if (/kickoff/.test(playTypeText(p).toLowerCase())) return false;
    return true;
  });
  if (kept.length && /punt/.test(playTypeText(kept[0]).toLowerCase())) kept.shift();
  return kept;
}
function realPlayCount(drive) {
  const explicit = drive?.offensivePlays;
  if (typeof explicit === "number" && explicit >= 0) return explicit;
  const plays = drive?.plays || [];
  const kept = plays.filter((p) => {
    const t = playTypeText(p).toLowerCase();
    if (isAdminPlay(p)) return false;
    if (/kickoff/.test(t)) return false;
    return true;
  });
  if (kept.length && /punt/.test(playTypeText(kept[0]).toLowerCase())) kept.shift();
  return kept.length;
}
function isAirPlay(p) {
  const t = playTypeText(p).toLowerCase();
  if (GROUND_OVERRIDE.test(t)) return false;
  return AIR_PLAY.test(t);
}
function ytgToUnit(ytg, frameIsHome) {
  return frameIsHome ? 10 + ytg : 110 - ytg;
}
function spotToUnit(abbr, yard, g) {
  if (abbr === g.away.abbr) return 10 + yard;
  if (abbr === g.home.abbr) return 110 - yard;
  return null;
}
function playGeom(p, offenseIsHome, homeId, awayId) {
  const s = numOrNull(p?.start?.yardsToEndzone);
  const e = numOrNull(p?.end?.yardsToEndzone);
  if (s == null || e == null) return null;
  const endTeamId = p?.end?.team?.id != null ? String(p.end.team.id) : "";
  let endFrameIsHome = offenseIsHome;
  if (endTeamId && (endTeamId === homeId || endTeamId === awayId)) {
    endFrameIsHome = endTeamId === homeId;
  }
  const startFrameIsHome = KICKOFF_PLAY.test(playTypeText(p)) ? !offenseIsHome : offenseIsHome;
  return {
    x1: clampUnit(ytgToUnit(s, startFrameIsHome)),
    x2: clampUnit(ytgToUnit(e, endFrameIsHome)),
    air: isAirPlay(p),
    penalty: p?.isPenalty === true,
    yards: Number(p?.statYardage) || 0
  };
}
function activeDrive(summary) {
  return summary?.drives?.current || (summary?.drives?.previous?.length ? summary.drives.previous[summary.drives.previous.length - 1] : null);
}
function offenseOf(summary, g) {
  const drive = activeDrive(summary);
  const id = drive?.team?.id != null ? String(drive.team.id) : "";
  if (id === g.home.id) return { team: g.home, isHome: true };
  if (id === g.away.id) return { team: g.away, isHome: false };
  if (g.homePossession) return { team: g.home, isHome: true };
  if (g.awayPossession) return { team: g.away, isHome: false };
  return null;
}
var CHANGE_POSS = /punt|kickoff|interception|fumble/i;
function spotOwnerOf(summary, g, off) {
  const { lastReal } = lastPlays(summary);
  if (lastReal && CHANGE_POSS.test(playTypeText(lastReal))) {
    const endId = lastReal?.end?.team?.id != null ? String(lastReal.end.team.id) : "";
    if (endId === g.home.id && !off.isHome) return { team: g.home, isHome: true };
    if (endId === g.away.id && off.isHome) return { team: g.away, isHome: false };
    if (!endId) return off.isHome ? { team: g.away, isHome: false } : { team: g.home, isHome: true };
  }
  return off;
}
function lastPlays(summary) {
  const drive = activeDrive(summary);
  const plays = drive?.plays || [];
  let last = null, lastReal = null;
  for (let i = plays.length - 1; i >= 0; i--) {
    if (!last) last = plays[i];
    if (!lastReal && !isAdminPlay(plays[i])) lastReal = plays[i];
    if (last && lastReal) break;
  }
  return { last, lastReal };
}
function laneLine(u1, u2, lane2 = false) {
  const y = lane2 ? FB.LANE2 : FB.LANE;
  const fx = lane2 ? xLane2 : xLane;
  return `M ${fx(u1).toFixed(1)} ${y} L ${fx(u2).toFixed(1)} ${y}`;
}
function arcPath(u1, u2, kick) {
  const a = xLane(u1), b = xLane(u2), y = FB.LANE;
  const cy = FB.T + (kick ? 1 : 4);
  const c1 = a + (b - a) * 0.2, c2 = a + (b - a) * 0.8;
  return `M ${a.toFixed(1)} ${y} C ${c1.toFixed(1)} ${cy}, ${c2.toFixed(1)} ${cy}, ${b.toFixed(1)} ${y}`;
}
function loopPath(u, dir) {
  const x = xLane(u);
  const midY = (FB.LANE + FB.LANE2) / 2;
  return `M ${x.toFixed(1)} ${FB.LANE} C ${(x + dir * 7).toFixed(1)} ${FB.LANE} ${(x + dir * 7).toFixed(1)} ${midY.toFixed(1)} ${(x + dir * 2).toFixed(1)} ${FB.LANE2}`;
}
function segLen(u1, u2, arc) {
  const d = Math.abs(xLane(u2) - xLane(u1));
  return arc ? d * 1.25 + 20 : d;
}
var CATCH_RE = /(?:kicks|punts)[^.]*? to ([A-Z]{2,4}) (\d{1,2})/;
var INT_RE = /INTERCEPTED.{0,50}? at ([A-Z]{2,4}) (\d{1,2})/i;
var FAIR_OR_TB = /fair catch|touchback/i;
function decomposePlay(p, off, g) {
  const gm = playGeom(p, off.isHome, g.home.id, g.away.id);
  if (!gm) return null;
  const ink = gm.penalty ? "var(--penalty-yellow)" : "var(--play-ink)";
  const text = String(p?.text || "");
  const tType = playTypeText(p);
  const segs = [];
  let xMark = null;
  let badge = null;
  let endUnit = gm.x2;
  const kickish = KICKOFF_PLAY.test(tType) || PUNT_PLAY.test(tType);
  if (INCOMPLETE_PLAY.test(tType)) {
    const dir = off.isHome ? -1 : 1;
    const to = clampUnit(gm.x1 + dir * 16);
    segs.push({ d: arcPath(gm.x1, to, false), len: segLen(gm.x1, to, true), kind: "arc", color: ink });
    xMark = to;
    endUnit = gm.x1;
  } else if (INT_PLAY.test(tType)) {
    const m = text.match(INT_RE);
    const pick = m ? spotToUnit(m[1], Number(m[2]), g) : null;
    const at = pick != null ? clampUnit(pick) : gm.x2;
    segs.push({ d: arcPath(gm.x1, at, false), len: segLen(gm.x1, at, true), kind: "arc", color: ink });
    const dir = off.isHome ? 1 : -1;
    segs.push({ d: loopPath(at, dir), len: 18, kind: "loop", color: ink });
    if (Math.abs(gm.x2 - at) > 0.5) {
      segs.push({ d: laneLine(at, gm.x2, true), len: segLen(at, gm.x2, false), kind: "return", color: ink });
      badge = `${Math.round(Math.abs(gm.x2 - at))}-Yd Return`;
    }
  } else if (kickish) {
    const m = text.match(CATCH_RE);
    const caught = m ? spotToUnit(m[1], Number(m[2]), g) : null;
    const at = caught != null ? clampUnit(caught) : gm.x2;
    segs.push({ d: arcPath(gm.x1, at, true), len: segLen(gm.x1, at, true), kind: "arc", color: ink });
    if (!FAIR_OR_TB.test(text) && Math.abs(gm.x2 - at) > 0.5) {
      segs.push({ d: laneLine(at, gm.x2, true), len: segLen(at, gm.x2, false), kind: "return", color: ink });
      badge = `${Math.round(Math.abs(gm.x2 - at))}-Yd Return`;
    }
  } else if (FG_PLAY.test(tType)) {
    const target = off.isHome ? 3 : 117;
    segs.push({ d: arcPath(gm.x1, target, true), len: segLen(gm.x1, target, true), kind: "arc", color: ink });
    endUnit = gm.x1;
  } else if (gm.air) {
    segs.push({ d: arcPath(gm.x1, gm.x2, false), len: segLen(gm.x1, gm.x2, true), kind: "arc", color: ink });
  } else if (Math.abs(gm.x2 - gm.x1) > 0.5) {
    segs.push({ d: laneLine(gm.x1, gm.x2), len: segLen(gm.x1, gm.x2, false), kind: "ground", color: ink });
  }
  if (!badge && gm.yards !== 0 && !FG_PLAY.test(tType)) {
    badge = `${gm.yards > 0 ? "+" : ""}${gm.yards} Yds`;
  }
  return { segs, xMark, badge, endUnit };
}
var durOf = (len) => Math.max(700, Math.min(2100, len * 7));
function ballShape() {
  return `<ellipse rx="5" ry="3.2" fill="#7a4a26" stroke="#4c2f17" stroke-width="0.8"/><line x1="-2" y1="0" x2="2" y2="0" stroke="#f0e6d8" stroke-width="0.7"/>`;
}
function pinMarkup(team, u) {
  const x = xLane(u).toFixed(1);
  const local = `/teams/${encodeURIComponent(team.id)}.png`;
  const T = FB.T;
  return `<g transform="translate(${x} 0)"><path class="fv-pin-tail" d="M -5 ${T + 7} L 0 ${T + 18} L 5 ${T + 7} Z"/><circle class="fv-pin-bubble" cy="${T - 5}" r="13"/><text class="fv-pin-abbr" y="${T - 1.5}" text-anchor="middle">${escapeHtml(team.abbr)}</text><image href="${local}" x="-10" y="${T - 15}" width="20" height="20" preserveAspectRatio="xMidYMid meet" onerror="this.remove()"/></g>`;
}
var lastAnimatedPlayId = "";
function renderFieldViz(summary, g, sit) {
  const svg = $("field-svg");
  if (!svg || !svg.firstChild) return;
  const driveG = $("fv-drive"), playG = $("fv-play"), pinG = $("fv-pin"), chipG = $("fv-chip"), first = $("fv-first");
  if (!driveG || !playG || !pinG || !chipG || !first) return;
  const off = offenseOf(summary, g);
  const drive = activeDrive(summary);
  const { last, lastReal } = lastPlays(summary);
  if (!off || !drive) {
    driveG.innerHTML = "";
    playG.innerHTML = "";
    pinG.style.display = "none";
    chipG.style.display = "none";
    first.style.display = "none";
    return;
  }
  const playKey = String(lastReal?.id ?? last?.id ?? "");
  const isNewPlay = !!playKey && playKey !== lastAnimatedPlayId;
  const viz = lastReal ? decomposePlay(lastReal, off, g) : null;
  let spot = viz ? viz.endUnit : null;
  if (spot == null && last) {
    const e = numOrNull(last?.end?.yardsToEndzone);
    if (e != null) spot = clampUnit(ytgToUnit(e, off.isHome));
  }
  if (spot == null && sit && sit.yardsToEndzone != null) {
    spot = clampUnit(ytgToUnit(sit.yardsToEndzone, off.isHome));
  }
  let driveStart = null;
  for (const p of drive.plays || []) {
    if (isAdminPlay(p) || KICKOFF_PLAY.test(playTypeText(p))) continue;
    const s = numOrNull(p?.start?.yardsToEndzone);
    if (s != null) {
      driveStart = clampUnit(ytgToUnit(s, off.isHome));
      break;
    }
  }
  driveG.innerHTML = driveStart != null && spot != null && Math.abs(spot - driveStart) > 1 ? `<path class="fv-driveline" d="${laneLine(driveStart, spot)}"/>` : "";
  let chainMs = 0;
  let out = "";
  if (viz && viz.segs.length) {
    if (isNewPlay) {
      let begin = 140;
      const mid = "fvm" + Date.now();
      let defs = "";
      viz.segs.forEach((seg, i) => {
        const dur = durOf(seg.len);
        defs += `<mask id="${mid}-${i}" maskUnits="userSpaceOnUse"><path d="${seg.d}" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"><animate attributeName="stroke-dashoffset" from="100" to="0" dur="${dur}ms" begin="${begin}ms" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.25 0.1 0.25 1"/></path></mask>`;
        out += `<path d="${seg.d}" fill="none" stroke="${seg.color}" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="6 5" mask="url(#${mid}-${i})"/>`;
        out += `<g opacity="1"><animate attributeName="opacity" from="1" to="0" begin="${begin + dur + 240}ms" dur="380ms" fill="freeze"/><g>${ballShape()}<animateMotion path="${seg.d}" begin="${begin}ms" dur="${dur}ms" fill="freeze" rotate="${seg.kind === "arc" ? "auto" : "0"}" calcMode="spline" keyTimes="0;1" keySplines="0.25 0.1 0.25 1"/></g></g>`;
        begin += dur + 160;
      });
      chainMs = begin;
      if (viz.xMark != null) {
        const xm = xLane(viz.xMark);
        out = `<defs>${defs}</defs>` + out + `<g opacity="0"><animate attributeName="opacity" from="0" to="1" begin="${chainMs - 60}ms" dur="320ms" fill="freeze"/><path class="fv-x" d="M ${(xm - 4.5).toFixed(1)} ${FB.LANE - 4.5} L ${(xm + 4.5).toFixed(1)} ${FB.LANE + 4.5} M ${(xm + 4.5).toFixed(1)} ${FB.LANE - 4.5} L ${(xm - 4.5).toFixed(1)} ${FB.LANE + 4.5}"/></g>`;
      } else {
        out = `<defs>${defs}</defs>` + out;
      }
    } else {
      viz.segs.forEach((seg) => {
        out += `<path d="${seg.d}" fill="none" stroke="${seg.color}" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="6 5"/>`;
      });
      if (viz.xMark != null) {
        const xm = xLane(viz.xMark);
        out += `<path class="fv-x" d="M ${(xm - 4.5).toFixed(1)} ${FB.LANE - 4.5} L ${(xm + 4.5).toFixed(1)} ${FB.LANE + 4.5} M ${(xm + 4.5).toFixed(1)} ${FB.LANE - 4.5} L ${(xm - 4.5).toFixed(1)} ${FB.LANE + 4.5}"/>`;
      }
    }
  }
  const owner = spotOwnerOf(summary, g, off);
  if (spot != null) {
    const d = owner.isHome ? -1 : 1;
    const hx = xLane(clampUnit(spot + d * 1.2));
    const arrow = `<path class="fv-arrow" d="M ${hx.toFixed(1)} ${FB.LANE - 5.5} L ${(hx + d * 10).toFixed(1)} ${FB.LANE} L ${hx.toFixed(1)} ${FB.LANE + 5.5} Z"/>`;
    out += isNewPlay ? `<g opacity="0"><animate attributeName="opacity" from="0" to="1" begin="${Math.max(0, chainMs - 80)}ms" dur="340ms" fill="freeze"/>${arrow}</g>` : arrow;
  }
  playG.innerHTML = out;
  if (isNewPlay) {
    try {
      svg.setCurrentTime(0);
    } catch {
    }
  }
  if (spot != null) {
    pinG.innerHTML = pinMarkup(owner.team, spot);
    pinG.style.display = "";
    if (isNewPlay) {
      pinG.classList.remove("anim-in");
      void pinG.offsetWidth;
      pinG.classList.add("anim-in");
      pinG.style.animationDelay = `${Math.max(0, chainMs - 80)}ms`;
    } else {
      pinG.style.animationDelay = "0ms";
    }
  } else pinG.style.display = "none";
  if (viz?.badge && spot != null) {
    const bx = xLane(spot);
    const w = Math.max(46, viz.badge.length * 6.4 + 14);
    chipG.innerHTML = `<rect class="fv-chipbg${lastReal?.isPenalty ? " pen" : ""}" x="${(bx - w / 2).toFixed(1)}" y="${(FB.LANE2 + 5).toFixed(1)}" rx="4" width="${w.toFixed(1)}" height="13"/><text class="fv-chiptext${lastReal?.isPenalty ? " pen" : ""}" x="${bx.toFixed(1)}" y="${(FB.LANE2 + 14.3).toFixed(1)}" text-anchor="middle">${escapeHtml(viz.badge)}</text>`;
    chipG.style.display = "";
    if (isNewPlay) {
      chipG.classList.remove("anim-in");
      void chipG.offsetWidth;
      chipG.classList.add("anim-in");
      chipG.style.animationDelay = `${chainMs}ms`;
    } else chipG.style.animationDelay = "0ms";
  } else chipG.style.display = "none";
  const dist = sit?.distance ?? numOrNull(lastReal?.end?.distance);
  if (spot != null && dist != null && dist > 0) {
    const f = clampUnit(owner.isHome ? spot - dist : spot + dist);
    first.setAttribute("x1", String(xT(f).toFixed(1)));
    first.setAttribute("y1", String(FB.T));
    first.setAttribute("x2", String(xB(f).toFixed(1)));
    first.setAttribute("y2", String(FB.B));
    first.style.display = "";
  } else first.style.display = "none";
  if (isNewPlay) lastAnimatedPlayId = playKey;
}
function renderDriveHeader(summary, g) {
  const hdr = $("drive-hdr");
  if (!hdr) return;
  const drive = summary?.drives?.current;
  const off = offenseOf(summary, g);
  if (!drive || !off) {
    hdr.style.display = "none";
    return;
  }
  const meta = [
    `${realPlayCount(drive)} plays`,
    drive?.yards != null ? `${drive.yards} yards` : "",
    drive?.timeElapsed?.displayValue || ""
  ].filter(Boolean).join(", ");
  const logoEl = $("dh-logo");
  if (logoEl) logoEl.innerHTML = logoHtml(off.team, "dh-logo-img");
  const metaEl = $("dh-meta");
  if (metaEl) metaEl.textContent = meta;
  hdr.style.display = "";
}
function replayLastPlay() {
  lastAnimatedPlayId = "";
  if (lastSummary && lastGame) {
    const sit = parseSituation(lastSummary, lastGame);
    renderFieldViz(lastSummary, lastGame, sit);
  }
}
function renderPlayBanner(summary, g) {
  const pill = $("penalty-pill");
  if (!pill) return;
  const { last, lastReal } = lastPlays(summary);
  const p = last?.isPenalty === true ? last : lastReal?.isPenalty === true ? lastReal : null;
  if (p) {
    const m = String(p?.text || "").match(/PENALTY on ([A-Z]{2,4})[^,]*,\s*([^,.]+)/);
    const abbr = m?.[1] || "";
    const name = (m?.[2] || "Penalty").trim();
    const team = abbr === g.home.abbr ? g.home : abbr === g.away.abbr ? g.away : null;
    pill.className = "play-banner on pen";
    pill.innerHTML = (team ? `<span class="pb-logo">${logoHtml(team, "pb-logo-img")}</span>` : "") + escapeHtml(name);
    return;
  }
  const scorer = lastReal?.scoringPlay === true ? lastReal : null;
  if (scorer) {
    const off = offenseOf(summary, g);
    const label = String(scorer?.type?.text || "Score").toUpperCase();
    pill.className = "play-banner on score";
    pill.innerHTML = (off ? `<span class="pb-logo">${logoHtml(off.team, "pb-logo-img")}</span>` : "") + escapeHtml(label);
    return;
  }
  pill.className = "play-banner";
  pill.innerHTML = "";
}
function renderField(summary, g, sit) {
  const lp = $("last-play");
  renderFieldViz(summary, g, sit);
  renderDriveHeader(summary, g);
  renderPlayBanner(summary, g);
  if (lp) {
    if (sit?.lastPlayText) {
      const { last } = lastPlays(summary);
      const title = String(last?.type?.text || "Last Play");
      lp.innerHTML = `<div class="lp-head"><span class="lp-title">${escapeHtml(title)}</span><span class="lp-chip">LAST PLAY</span></div>` + escapeHtml(sit.lastPlayText);
      lp.style.display = "";
    } else lp.style.display = "none";
  }
}
function renderLinescore(g) {
  const el = $("linescore-container");
  if (!el) return;
  const nQ = Math.max(4, g.home.linescores.length, g.away.linescores.length);
  if (g.phase === "pre" || !g.home.linescores.length && !g.away.linescores.length) {
    el.innerHTML = "";
    return;
  }
  let header = '<th class="ls-team-col"></th>';
  for (let i = 1; i <= nQ; i++) {
    const lbl = i <= 4 ? String(i) : "OT" + (nQ > 5 ? i - 4 : "");
    header += `<th class="ls-inning-h${i === g.period ? " ls-current" : ""}">${lbl}</th>`;
  }
  header += '<th class="ls-total ls-r-header">T</th>';
  const row = (t, loser) => {
    let cells = `<td class="ls-team-col">${logoHtml(t, "ls-team-logo")}<span class="ls-team-abbr">${escapeHtml(t.abbr)}</span></td>`;
    for (let i = 1; i <= nQ; i++) {
      const v = t.linescores[i - 1];
      const has = v != null && i <= t.linescores.length;
      let cls = "ls-inning";
      let style = "";
      if (!has) cls += " ls-empty";
      else if (v === 0) cls += " ls-zero";
      else {
        cls += " ls-nonzero ls-scored";
      }
      if (i === g.period && g.phase === "in") cls += " ls-current";
      cells += `<td class="${cls}"${style}>${has ? v : "\u2013"}</td>`;
    }
    cells += `<td class="ls-total ls-r-value ${t.score === 0 ? "ls-zero" : "ls-nonzero"}">${t.score}</td>`;
    return `<tr>${cells}</tr>`;
  };
  const final = g.phase === "post" && !isPostponedName(g.statusName);
  el.innerHTML = `<table class="linescore-compact"><thead><tr>${header}</tr></thead><tbody>` + row(g.away, final && g.home.score > g.away.score) + row(g.home, final && g.away.score > g.home.score) + "</tbody></table>";
}
function postseasonName(week) {
  switch (week) {
    case 1:
      return "Wild Card";
    case 2:
      return "Divisional Round";
    case 3:
      return "Conference Championship";
    case 4:
      return "Pro Bowl";
    case 5:
      return "Super Bowl";
    default:
      return "Playoffs";
  }
}
function gameContextLabel(g) {
  if (g.seasonType === 3) return postseasonName(g.week).toUpperCase();
  if (g.seasonType === 1) return "PRESEASON" + (g.week ? ` \xB7 WEEK ${g.week}` : "");
  return g.week ? `WEEK ${g.week}` : "";
}
var openInjuries = /* @__PURE__ */ new Set();
function oddsBlockHtml(g) {
  const list = (lastSummary?.pickcenter?.length ? lastSummary.pickcenter : lastSummary?.odds) || [];
  const o = list.find((x) => x?.details != null || x?.overUnder != null) || list[0];
  if (!o) return "";
  const prov = String(o?.provider?.name || "");
  const spread = String(o?.details || "");
  const ou = o?.overUnder != null ? String(o.overUnder) : "";
  const awayMl = o?.awayTeamOdds?.moneyLine, homeMl = o?.homeTeamOdds?.moneyLine;
  const ml = (v) => v == null ? "\u2014" : Number(v) > 0 ? `+${v}` : String(v);
  return `<div class="pg-odds rise-in" style="--i:1"><div class="pg-sec-hdr">BETTING LINE${prov ? ` <span class="pg-prov">${escapeHtml(prov)}</span>` : ""}</div><div class="pg-odds-grid"><div class="pg-odd pg-odd-fill"><span class="pg-odd-k">SPREAD</span><span class="pg-odd-v">${escapeHtml(spread || "\u2014")}</span></div><div class="pg-odd pg-odd-fill"><span class="pg-odd-k">OVER / UNDER</span><span class="pg-odd-v">${escapeHtml(ou || "\u2014")}</span></div><div class="pg-odd"><span class="pg-odd-k">${escapeHtml(g.away.abbr)} ML</span><span class="pg-odd-v">${escapeHtml(ml(awayMl))}</span></div><div class="pg-odd"><span class="pg-odd-k">${escapeHtml(g.home.abbr)} ML</span><span class="pg-odd-v">${escapeHtml(ml(homeMl))}</span></div></div></div>`;
}
function injuryListHtml(entries, color) {
  if (!entries.length) return `<div class="pg-inj-none">No reported injuries</div>`;
  return entries.map((it, i) => {
    const a = it?.athlete || {};
    const head = a?.headshot?.href ? `<img class="pg-inj-head" data-psrc="${escapeHtml(proxied(String(a.headshot.href)))}" alt="">` : `<span class="pg-inj-head ph"></span>`;
    const pos = String(a?.position?.abbreviation || "");
    const num = a?.jersey != null ? `#${escapeHtml(String(a.jersey))}` : "";
    const status = String(it?.status || it?.type?.description || "");
    return `<div class="pg-inj-row" style="--i:${i}">` + head + `<div class="pg-inj-who"><div class="pg-inj-name">${escapeHtml(String(a?.displayName || "\u2014"))}</div><div class="pg-inj-meta">${escapeHtml(pos)}${pos && num ? " \xB7 " : ""}${num}</div></div><span class="pg-inj-status" style="--sc:${color}">${escapeHtml(status.toUpperCase())}</span></div>`;
  }).join("");
}
function injuriesFor(teamId) {
  const groups = lastSummary?.injuries || [];
  const grp = groups.find((x) => String(x?.team?.id) === String(teamId));
  return grp?.injuries || [];
}
function injuryPanelHtml(g, home) {
  const t = home ? g.home : g.away;
  const color = railColorOf(t, home ? "#013369" : "#d50a0a");
  const list = injuriesFor(t.id);
  const key = home ? "home" : "away";
  const open = openInjuries.has(key);
  return `<div class="pg-inj-card${open ? " is-open" : ""}" data-inj="${key}" style="--tc:${color}"><button class="pg-inj-btn" type="button" data-inj-btn="${key}">` + logoImg(t, "pg-inj-logo") + `<span class="pg-inj-label">${escapeHtml(t.abbr)} INJURIES</span><span class="pg-inj-count">${list.length}</span><svg class="pg-inj-chev" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg></button><div class="pg-inj-body"><div class="pg-inj-list">${injuryListHtml(list, color)}</div></div></div>`;
}
function bindInjuryToggles(root, g) {
  root.querySelectorAll("[data-inj-btn]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-inj-btn") || "";
      const card = btn.closest(".pg-inj-card");
      if (!card) return;
      const nowOpen = !card.classList.contains("is-open");
      card.classList.toggle("is-open", nowOpen);
      if (nowOpen) openInjuries.add(key);
      else openInjuries.delete(key);
      syncPagerAfterAnimation();
    });
  });
  void g;
}
function renderPregame(g) {
  const body = $("pregame-body");
  if (!body) return;
  const venue = g.venue?.fullName ? String(g.venue.fullName) : "";
  const loc = g.venue?.address ? [g.venue.address.city, g.venue.address.state].filter(Boolean).join(", ") : "";
  const awayColor = railColorOf(g.away, "#d50a0a");
  const homeColor = railColorOf(g.home, "#013369");
  const PIN_ICON = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>';
  const STADIUM_ICON = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8c0-1.7 4-3 9-3s9 1.3 9 3-4 3-9 3-9-1.3-9-3z"/><path d="M3 8v6c0 1.7 4 3 9 3s9-1.3 9-3V8"/></svg>';
  let html = "";
  if (loc || venue) {
    html += `<div class="pg-place rise-in" style="--i:0">`;
    if (loc) {
      html += `<div class="pg-place-row"><div class="pg-place-k">${PIN_ICON}<span>LOCATION</span></div><div class="pg-place-v">${escapeHtml(loc.toUpperCase())}</div></div>`;
    }
    if (venue) {
      html += `<div class="pg-place-row"><div class="pg-place-k">${STADIUM_ICON}<span>STADIUM</span></div><div class="pg-place-v">${escapeHtml(venue.toUpperCase())}</div></div>`;
    }
    html += `</div>`;
  }
  void awayColor;
  void homeColor;
  html += oddsBlockHtml(g);
  html += `<div class="pg-inj-wrap rise-in" style="--i:2">` + injuryPanelHtml(g, false) + injuryPanelHtml(g, true) + `</div>`;
  body.innerHTML = html;
  bindInjuryToggles(body, g);
  hydrateProxiedImages(body);
}
var YDS_RE = /(\d+(?:\.\d+)?)\s*YDS/i;
function leaderYards(top) {
  const dv = String(top?.displayValue || "");
  const m = dv.match(YDS_RE);
  if (m) return parseFloat(m[1]);
  const n = parseFloat(dv);
  return isFinite(n) ? n : 0;
}
function gameLeaderFor(catName, g) {
  const L = lastSummary?.leaders || [];
  let best = null;
  let bestVal = -1;
  L.forEach((side) => {
    const team = String(side?.team?.id) === g.home.id ? g.home : g.away;
    (side?.leaders || []).forEach((cat) => {
      if (String(cat?.name) !== catName) return;
      const top = cat?.leaders?.[0];
      if (!top) return;
      const v = leaderYards(top);
      if (v > bestVal) {
        bestVal = v;
        best = {
          name: String(top.athlete?.shortName || top.athlete?.displayName || ""),
          head: top.athlete?.headshot?.href ? proxied(String(top.athlete.headshot.href)) : "",
          big: String(Math.round(v)),
          unit: "YDS",
          sub: String(top.displayValue || ""),
          team
        };
      }
    });
  });
  return bestVal > 0 ? best : null;
}
function sackLeader(g) {
  const bplayers = lastSummary?.boxscore?.players || [];
  let best = null;
  let bestVal = 0;
  bplayers.forEach((side) => {
    const team = String(side?.team?.id) === g.home.id ? g.home : g.away;
    (side?.statistics || []).forEach((grp) => {
      if (!/defens/i.test(String(grp?.name || grp?.text || ""))) return;
      const labels = grp?.labels || [];
      const idx = labels.findIndex((l) => /^SACKS?$/i.test(l));
      if (idx < 0) return;
      (grp?.athletes || []).forEach((row) => {
        const v = parseFloat(String(row?.stats?.[idx] ?? "0")) || 0;
        if (v > bestVal) {
          bestVal = v;
          best = {
            name: String(row.athlete?.shortName || row.athlete?.displayName || ""),
            head: row.athlete?.headshot?.href ? proxied(String(row.athlete.headshot.href)) : "",
            big: String(v),
            unit: v === 1 ? "SACK" : "SACKS",
            sub: "",
            team
          };
        }
      });
    });
  });
  return bestVal > 0 ? best : null;
}
function buildTopPerformers(g) {
  const cats = [
    { label: "Passing", p: gameLeaderFor("passingYards", g) },
    { label: "Rushing", p: gameLeaderFor("rushingYards", g) },
    { label: "Receiving", p: gameLeaderFor("receivingYards", g) },
    { label: "Sacks", p: sackLeader(g) }
  ];
  const cards = cats.filter((c) => c.p);
  if (!cards.length) return "";
  let out = `<div class="tp-hdr">TOP PERFORMERS</div><div class="tp-grid">`;
  cards.forEach((c, i) => {
    const p = c.p;
    const color = statInkOf(p.team, p.team.id === g.home.id ? "#013369" : "#d50a0a");
    out += `<div class="tp-card rise-in" style="--i:${i};--tc:${color}"><div class="tp-cat">${escapeHtml(c.label)}</div><div class="tp-row">` + (p.head ? `<img class="tp-head" data-psrc="${escapeHtml(p.head)}" alt="">` : `<span class="tp-head ph"></span>`) + `<span class="tp-name">${escapeHtml(p.name)}</span></div><div class="tp-big">${escapeHtml(p.big)}<small>${escapeHtml(p.unit)}</small></div>` + (p.sub ? `<div class="tp-sub">${escapeHtml(p.sub)}</div>` : "") + `</div>`;
  });
  return out + "</div>";
}
function renderFinal(g) {
  const body = $("final-body");
  if (!body) return;
  let html = buildTopPerformers(g);
  body.innerHTML = html;
  hydrateProxiedImages(body);
}
function renderPostponed(g) {
  const body = $("postponed-body");
  if (!body) return;
  const detail = g.statusDetail && !/^postponed$/i.test(g.statusDetail.trim()) ? g.statusDetail : "";
  body.innerHTML = `<div class="ended-display" style="padding:14px 0 4px"><div class="ended-headline">Postponed</div><div class="ended-divider"></div><div class="ended-text">${escapeHtml(g.away.name)} at ${escapeHtml(g.home.name)}` + (detail ? `<br>${escapeHtml(detail)}` : "") + `</div></div>`;
}
var statsView = "team";
var statsAnimate = false;
var LOWER_BETTER = /turnover|penalt|interception|fumbles lost|sacks-yards lost/i;
function statNum(v) {
  const s = String(v).trim();
  const clock = s.match(/^(\d+):(\d{2})$/);
  if (clock) return Number(clock[1]) * 60 + Number(clock[2]);
  const frac = s.match(/^(\d+)\s*-\s*(\d+)$/);
  if (frac) return Number(frac[1]);
  const n = parseFloat(s);
  return isFinite(n) ? n : null;
}
function logoImg(t, cls) {
  return `<img class="${cls}" src="/teams/${encodeURIComponent(t.id)}.png" alt="${escapeHtml(t.abbr)}" data-tid="${escapeHtml(t.id)}" data-tabbr="${escapeHtml(t.abbr)}" onerror="window.__logoFb(this)">`;
}
function buildTeamCompare(g) {
  const bteams = lastSummary?.boxscore?.teams || [];
  if (bteams.length !== 2) return '<div class="bs-empty">No team stats yet</div>';
  let a = bteams[0], h = bteams[1];
  if (String(a?.team?.id) === g.home.id) {
    const t = a;
    a = h;
    h = t;
  }
  const ac = railColorOf(g.away, "#d50a0a"), hc = railColorOf(g.home, "#013369");
  const rows = {};
  (a?.statistics || []).forEach((st) => {
    rows[st.name] = { label: st.label || st.name, a: st.displayValue };
  });
  (h?.statistics || []).forEach((st) => {
    rows[st.name] = rows[st.name] || { label: st.label || st.name };
    rows[st.name].h = st.displayValue;
  });
  let out = `<div class="ts-head"><span class="ts-head-team">${logoImg(g.away, "ts-logo")}</span><span class="ts-head-label">TEAM STATS</span><span class="ts-head-team">${logoImg(g.home, "ts-logo")}</span></div>`;
  let i = 0;
  Object.keys(rows).forEach((k) => {
    const r = rows[k];
    const av = statNum(r.a ?? ""), hv = statNum(r.h ?? "");
    const lower = LOWER_BETTER.test(r.label) || LOWER_BETTER.test(k);
    let aWin = false, hWin = false, aPct = 50;
    if (av != null && hv != null && av + hv > 0) {
      aPct = av / (av + hv) * 100;
      if (av !== hv) {
        aWin = lower ? av < hv : av > hv;
        hWin = !aWin;
      }
    }
    out += `<div class="ts-row${statsAnimate ? " rise-in" : ""}" style="--i:${i++}"><div class="ts-vals"><span class="ts-val${aWin ? " win" : ""}"${aWin ? ` style="color:${ac}"` : ""}>${escapeHtml(r.a ?? "\u2014")}</span><span class="ts-label">${escapeHtml(r.label)}</span><span class="ts-val${hWin ? " win" : ""}"${hWin ? ` style="color:${hc}"` : ""}>${escapeHtml(r.h ?? "\u2014")}</span></div><div class="ts-bar"><span style="width:${aPct.toFixed(1)}%;background:${ac}"></span><span style="width:${(100 - aPct).toFixed(1)}%;background:${hc}"></span></div></div>`;
  });
  return out;
}
var LEADER_LABELS = {
  passingYards: "Passing",
  rushingYards: "Rushing",
  receivingYards: "Receiving",
  sacks: "Sacks",
  totalTackles: "Tackles",
  interceptions: "Interceptions"
};
function buildLeaderCards(g) {
  const L = lastSummary?.leaders || [];
  if (!L.length) return '<div class="bs-empty">No leaders yet</div>';
  const byCat = /* @__PURE__ */ new Map();
  L.forEach((side) => {
    const isHome = String(side?.team?.id) === g.home.id;
    (side?.leaders || []).forEach((cat) => {
      const top = cat?.leaders?.[0];
      if (!top) return;
      const key = String(cat.name || cat.displayName || "");
      const cur = byCat.get(key) || {};
      if (isHome) cur.home = top;
      else cur.away = top;
      byCat.set(key, cur);
    });
  });
  const ac = railColorOf(g.away, "#d50a0a"), hc = railColorOf(g.home, "#013369");
  let out = "";
  let i = 0;
  byCat.forEach((pair, key) => {
    const label = LEADER_LABELS[key] || String(key).replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
    const row = (top, _team, color) => {
      if (!top) return "";
      const ath = top.athlete || {};
      const head = ath.headshot?.href ? proxied(String(ath.headshot.href)) : "";
      return `<div class="ld-row" style="--tc:${color}">` + (head ? `<img class="ld-head" data-psrc="${escapeHtml(head)}" alt="">` : `<span class="ld-head ph"></span>`) + `<span class="ld-who"><span class="ld-name">${escapeHtml(ath.shortName || ath.displayName || "")}</span><span class="ld-stat">${escapeHtml(String(top.displayValue || ""))}</span></span></div>`;
    };
    out += `<div class="ld-card${statsAnimate ? " rise-in" : ""}" style="--i:${i++}"><div class="ld-cat">${escapeHtml(label)}</div>` + row(pair.away, g.away, ac) + row(pair.home, g.home, hc) + `</div>`;
  });
  return `<div class="ld-grid">${out}</div>`;
}
function buildPlayerPanel(teamId) {
  const bplayers = lastSummary?.boxscore?.players || [];
  const side = bplayers.find((p) => String(p?.team?.id) === teamId);
  if (!side) return '<div class="bs-empty">No player stats yet</div>';
  let out = "";
  (side.statistics || []).forEach((grp) => {
    const ath = grp?.athletes || [];
    if (!ath.length) return;
    const labels = grp.labels || [];
    out += `<div class="bs-section-hdr"><span class="bs-dot"></span>${escapeHtml(grp.text || grp.name || "")}</div>`;
    out += `<table class="bs-table"><thead><tr><th class="bs-th-player">Player</th>`;
    labels.forEach((l) => {
      out += `<th>${escapeHtml(l)}</th>`;
    });
    out += "</tr></thead><tbody>";
    ath.forEach((row) => {
      const nm = row?.athlete?.shortName || row?.athlete?.displayName || "";
      out += `<tr class="bs-row"><td class="bs-player"><div class="bs-pname">${escapeHtml(nm)}</div></td>`;
      (row?.stats || []).forEach((v) => {
        out += `<td>${escapeHtml(String(v))}</td>`;
      });
      out += "</tr>";
    });
    out += "</tbody></table>";
  });
  return out || '<div class="bs-empty">No player stats yet</div>';
}
function renderStatsTab() {
  const g = lastGame;
  const root = $("tab-box");
  if (!g || !root) return;
  let html = `<div class="plays-toggle" id="stats-toggle" data-active="${statsView}" style="--seg-i:${statsView === "players" ? 1 : 0}"><span class="plays-toggle-thumb"></span><button class="plays-seg${statsView === "team" ? " is-active" : ""}" data-stats="team" type="button">Team</button><button class="plays-seg${statsView === "players" ? " is-active" : ""}" data-stats="players" type="button">Players</button></div>`;
  if (statsView === "team") {
    html += `<div class="ts-wrap">${buildTeamCompare(g)}</div>`;
  } else {
    html += buildLeaderCards(g);
    html += `<div class="bs-team-tabs"><button class="bs-team-tab${statsBoxTeam === "away" ? " active" : ""}" data-bs-team="away" type="button"><span class="bs-team-tab-logo">${logoImg(g.away, "bs-team-tab-logo")}</span></button><button class="bs-team-tab${statsBoxTeam === "home" ? " active" : ""}" data-bs-team="home" type="button"><span class="bs-team-tab-logo">${logoImg(g.home, "bs-team-tab-logo")}</span></button></div><div class="bs-panel-wrap"><div class="bs-panel active">` + buildPlayerPanel(statsBoxTeam === "home" ? g.home.id : g.away.id) + `</div></div>`;
  }
  root.innerHTML = html;
  hydrateProxiedImages(root);
  statsAnimate = false;
  root.querySelectorAll("#stats-toggle .plays-seg").forEach((seg) => {
    seg.addEventListener("click", () => {
      const v = seg.getAttribute("data-stats");
      if (v === "team" || v === "players") {
        statsView = v;
        statsAnimate = true;
        renderStatsTab();
      }
    });
  });
  root.querySelectorAll(".bs-team-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const t = btn.dataset.bsTeam;
      if (t === "away" || t === "home") {
        statsBoxTeam = t;
        renderStatsTab();
      }
    });
  });
}
var statsBoxTeam = "away";
var openDrives = /* @__PURE__ */ new Set();
var playsAnimate = false;
function driveTeamOf(d, g) {
  const id = d?.team?.id != null ? String(d.team.id) : "";
  return id === g.home.id ? g.home : id === g.away.id ? g.away : null;
}
var PLAY_ICONS = {
  pass: '<path d="M3 12c3-5 15-5 18 0-3 5-15 5-18 0z"/><path d="M9 10.5l1.5 3M12 10l0 4M15 10.5l-1.5 3"/>',
  run: '<path d="M4 17h9M8 12h9M6 7h9"/><path d="M17 9l3 3-3 3"/>',
  sack: '<path d="M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z"/>',
  kick: '<path d="M6 18c6 0 12-6 12-12"/><path d="M15 3l3 3-3 3M4 20l2-2"/>',
  int: '<path d="M4 7h10l3 3M4 17h10l3-3"/><path d="M14 4l3 3-3 3M14 20l3-3-3-3"/>',
  flag: '<path d="M6 21V4"/><path d="M6 4h11l-2.5 3.5L17 11H6"/>',
  dot: '<circle cx="12" cy="12" r="3"/>'
};
function playIconKey(t) {
  const s = t.toLowerCase();
  if (/interception/.test(s)) return "int";
  if (/sack/.test(s)) return "sack";
  if (/punt|kick|field goal|extra point/.test(s)) return "kick";
  if (/pass|reception|incompletion/.test(s)) return "pass";
  if (/rush|run/.test(s)) return "run";
  if (/penalty/.test(s)) return "flag";
  return "dot";
}
function playIcon(t) {
  return `<svg class="dp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${PLAY_ICONS[playIconKey(t)]}</svg>`;
}
var PERIOD_LC = ["", "1st", "2nd", "3rd", "4th"];
function periodLc(n) {
  if (n <= 0) return "";
  return PERIOD_LC[n] || "OT" + (n > 5 ? String(n - 4) : "");
}
function playTitle(p) {
  const t = playTypeText(p);
  const y = Number(p?.statYardage) || 0;
  const text = String(p?.text || "");
  if (/kickoff/i.test(t)) {
    const m = text.match(/from ([A-Z]{2,4} \d{1,2})/);
    return "Kickoff" + (m ? ` from ${m[1]}` : "");
  }
  if (/interception/i.test(t)) return "Interception";
  if (/punt/i.test(t)) return "Punt";
  if (/field goal|extra point/i.test(t)) return t;
  if (/penalty/i.test(t)) return "Penalty";
  if (/sack/i.test(t)) return `${y} Yard Sack`;
  if (/incompletion/i.test(t)) return "Incomplete Pass";
  if (/pass|reception/i.test(t)) return `${y} Yard Pass`;
  if (/rush|run/i.test(t)) return `${y} Yard Run`;
  return t || "Play";
}
function playEntryHtml(p, color) {
  const title = playTitle(p);
  const dd = String(p?.start?.downDistanceText || "");
  let text = String(p?.text || "").trim();
  let boldSuffix = "";
  const form = text.match(/^\((.*?)\)\s*/);
  if (form) {
    boldSuffix = " " + form[1];
    text = text.slice(form[0].length);
  }
  const clk = `${p?.clock?.displayValue || ""} ${periodLc(Number(p?.period?.number) || 0)}`.trim();
  return `<div class="dp-entry" style="--rail:${color}"><div class="dp-title">${playIcon(playTypeText(p))}<b>${escapeHtml(title)}</b>` + (dd ? `<span class="dp-dd"> \xB7 ${escapeHtml(dd)}</span>` : "") + `</div><div class="dp-body"><b>${escapeHtml(clk)}${escapeHtml(boldSuffix)}</b>${clk || boldSuffix ? " \u2014 " : ""}${escapeHtml(text)}</div></div>`;
}
function ordinalQuarter(period) {
  if (period >= 5) return period === 5 ? "OVERTIME" : `${period - 4}OT`;
  const ord = ["", "1ST", "2ND", "3RD", "4TH"][period] || `${period}TH`;
  return `${ord} QUARTER`;
}
function driveOfPlay(playId) {
  const s = lastSummary || {};
  const all = [...s.drives?.previous || []];
  if (s.drives?.current) all.push(s.drives.current);
  for (const d of all) {
    if ((d?.plays || []).some((p) => String(p?.id) === playId)) return d;
  }
  return null;
}
function buildScoringCards(_compact) {
  const g = lastGame;
  const sp = lastSummary?.scoringPlays || [];
  if (!g || !sp.length) return '<div class="plays-empty">No scoring plays yet</div>';
  let html = "";
  let lastPeriod = -1;
  let i = 0;
  for (const p of sp) {
    const period = Number(p?.period?.number ?? p?.period) || 0;
    if (period !== lastPeriod) {
      html += `<div class="sc-qtr${playsAnimate ? " rise-in" : ""}" style="--i:${i}">${escapeHtml(ordinalQuarter(period))}</div>`;
      lastPeriod = period;
      i++;
    }
    const teamId = p?.team?.id != null ? String(p.team.id) : "";
    const isHome = teamId === g.home.id;
    const team = isHome ? g.home : g.away;
    const color = railColorOf(team, isHome ? "#013369" : "#d50a0a");
    const typeName = String(p?.scoringType?.displayName || p?.type?.text || "Score");
    const clock = `${escapeHtml(String(p?.clock?.displayValue || ""))} - ${escapeHtml(String(period <= 4 ? ["", "1st", "2nd", "3rd", "4th"][period] : "OT"))}`;
    const away = Number(p?.awayScore) || 0, home = Number(p?.homeScore) || 0;
    const drive = driveOfPlay(String(p?.id));
    const dPlays = drive ? realPlayCount(drive) : 0;
    const dYards = drive?.yards;
    const dTime = drive?.timeElapsed?.displayValue;
    const driveLine = drive && (dPlays || dYards != null) ? `<div class="sc-drive">${dPlays} plays${dYards != null ? `, ${escapeHtml(String(dYards))} yards` : ""}${dTime ? `, ${escapeHtml(String(dTime))}` : ""}</div>` : "";
    html += `<div class="sc-card${playsAnimate ? " rise-in" : ""}" style="--i:${i};--tc:${color}"><div class="sc-top">` + logoImg(team, "sc-logo") + `<div class="sc-title-wrap"><div class="sc-type">${escapeHtml(typeName)}</div><div class="sc-clock">${clock}</div></div><div class="sc-scores"><div class="sc-col${!isHome ? " sc-col-scored" : ""}"><span class="sc-num">${away}</span><span class="sc-abbr">${escapeHtml(g.away.abbr)}</span></div><div class="sc-col${isHome ? " sc-col-scored" : ""}"><span class="sc-num">${home}</span><span class="sc-abbr">${escapeHtml(g.home.abbr)}</span></div></div></div><div class="sc-desc">${escapeHtml(String(p?.text || ""))}</div>` + driveLine + `</div>`;
    i++;
  }
  return html;
}
function driveScores(d) {
  const plays = d?.plays || [];
  for (let i = plays.length - 1; i >= 0; i--) {
    const p = plays[i];
    if (p?.awayScore != null || p?.homeScore != null) {
      return { away: Number(p.awayScore) || 0, home: Number(p.homeScore) || 0 };
    }
  }
  return null;
}
function buildDriveCards(g) {
  const s = lastSummary || {};
  const list = [];
  if (s.drives?.current) list.push({ d: s.drives.current, current: true, key: "cur" });
  const prev = s.drives?.previous || [];
  for (let i = prev.length - 1; i >= 0; i--) list.push({ d: prev[i], current: false, key: "d" + i });
  if (!list.length) return '<div class="plays-empty">No drives yet</div>';
  return list.map((w, idx) => {
    const d = w.d;
    const team = driveTeamOf(d, g);
    const color = team ? railColorOf(team, team.id === g.home.id ? "#013369" : "#d50a0a") : "var(--text-muted)";
    const result = String(d?.displayResult || d?.result || (w.current ? "In Progress" : ""));
    const stat = (label, val) => `<span class="dv-stat"><span class="dv-stat-k">${label}</span><span class="dv-stat-v">${escapeHtml(val)}</span></span>`;
    const sc = driveScores(d);
    const open = openDrives.has(w.key);
    const plays = displayPlaysOf(d);
    const body = plays.length ? `<div class="drive-body"><div class="dp-list">${plays.map((p) => playEntryHtml(p, color)).join("")}</div></div>` : "";
    return `<button type="button" class="drive-card${w.current ? " current" : ""}${open ? " open" : ""}${playsAnimate ? " rise-in" : ""}" data-drive="${w.key}" style="--i:${idx}"><div class="drive-head">` + (team ? logoImg(team, "drive-logo") : "") + `<span class="dv-result">${escapeHtml(result)}</span>` + stat("PLAYS", String(realPlayCount(d))) + stat("YDS", String(d?.yards ?? "\u2014")) + stat("TTL TIME", String(d?.timeElapsed?.displayValue || "\u2014")) + (sc ? `<span class="dv-score"><span class="dv-score-t">${logoImg(g.away, "dv-score-logo")}<b>${sc.away}</b></span><span class="dv-score-t">${logoImg(g.home, "dv-score-logo")}<b>${sc.home}</b></span></span>` : "") + `<svg class="drive-chev" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg></div>${body}</button>`;
  }).join("");
}
function renderPlaysTab() {
  const g = lastGame;
  if (!g) return;
  const scoring = $("scoring-plays-list");
  const drives = $("all-plays-list");
  if (scoring) scoring.innerHTML = buildScoringCards(false);
  if (drives) {
    drives.innerHTML = buildDriveCards(g);
    drives.querySelectorAll(".drive-card[data-drive]").forEach((card) => {
      card.addEventListener("click", () => {
        const key = card.getAttribute("data-drive");
        if (!key) return;
        if (openDrives.has(key)) openDrives.delete(key);
        else openDrives.add(key);
        card.classList.toggle("open");
        syncPagerAfterAnimation();
      });
    });
  }
  playsAnimate = false;
  void loadClipsInto("plays-clips");
}
function setPlaysView(which) {
  const toggle = $("plays-toggle");
  const scoringList = $("scoring-plays-list");
  const allList = $("all-plays-list");
  if (!toggle || !scoringList || !allList) return;
  toggle.setAttribute("data-active", which);
  toggle.querySelectorAll(".plays-seg").forEach((seg) => {
    seg.classList.toggle("is-active", seg.getAttribute("data-plays") === which);
    const track = seg.closest(".plays-toggle");
    if (track) track.style.setProperty("--seg-i", which === "all" ? "1" : "0");
  });
  const show = which === "all" ? allList : scoringList;
  const hide = which === "all" ? scoringList : allList;
  hide.hidden = true;
  show.hidden = false;
  show.classList.remove("plays-list-enter");
  void show.offsetWidth;
  show.classList.add("plays-list-enter");
}
function setupPlaysToggle() {
  const toggle = $("plays-toggle");
  if (!toggle) return;
  toggle.querySelectorAll(".plays-seg").forEach((seg) => {
    seg.addEventListener("click", () => {
      const which = seg.getAttribute("data-plays");
      if (which === "scoring" || which === "all") setPlaysView(which);
    });
  });
}
var clipsCache = null;
var clipsCacheTs = 0;
async function loadClipsInto(containerId) {
  const el = $(containerId);
  if (!el || eventId == null) return;
  const now = Date.now();
  if (!clipsCache || now - clipsCacheTs > 6e4) {
    try {
      const res = await fetch(`/api/clips/${eventId}`);
      if (res.ok) {
        const data = await res.json();
        clipsCache = data?.clips || [];
        clipsCacheTs = now;
      }
    } catch (e) {
      reportError("loadClips", e);
    }
  }
  const clips = clipsCache || [];
  if (!clips.length) {
    el.innerHTML = "";
    return;
  }
  el.className = "clips-grid";
  el.innerHTML = clips.slice(0, 8).map(
    (c) => `<button class="clip-card" type="button" data-url="${escapeHtml(String(c.url || ""))}"><div class="clip-media">` + (c.thumbnail ? `<img data-psrc="${escapeHtml(proxied(String(c.thumbnail)))}" alt="">` : "") + `<span class="clip-play">\u25B6</span></div><div class="chead">${escapeHtml(String(c.headline || "Highlight"))}</div></button>`
  ).join("");
  hydrateProxiedImages(el);
  el.querySelectorAll(".clip-card[data-url]").forEach((card) => {
    card.addEventListener("click", () => {
      const url = card.getAttribute("data-url");
      if (!url) return;
      try {
        navigateTo(url);
      } catch (e) {
        reportError("navigateTo(clip)", e);
      }
    });
  });
}
var winProbCache = null;
async function fetchWinProb() {
  if (!eventId) return null;
  try {
    const res = await fetch(`/api/winprob/${eventId}`);
    if (!res.ok) return winProbCache;
    const data = await res.json();
    const arr = Array.isArray(data) ? data : data?.winprobability;
    if (Array.isArray(arr)) {
      winProbCache = arr;
      return arr;
    }
    return winProbCache;
  } catch (e) {
    reportError("fetchWinProb", e);
    return winProbCache;
  }
}
function buildPlayIndex() {
  const map = /* @__PURE__ */ new Map();
  const add = (plays) => {
    for (const p of plays) {
      if (p?.id != null) map.set(String(p.id), {
        period: Number(p?.period?.number) || 0,
        text: String(p?.text || "")
      });
    }
  };
  const prev = lastSummary?.drives?.previous || [];
  prev.forEach((d) => add(d?.plays || []));
  if (lastSummary?.drives?.current) add(lastSummary.drives.current.plays || []);
  return map;
}
var wpAnimate = false;
async function renderWinProb() {
  try {
    await renderWinProbInner();
  } finally {
    wpAnimate = false;
  }
}
async function renderWinProbInner() {
  const container = $("tab-winprob");
  if (!container) return;
  const g = lastGame;
  if (!g) {
    container.innerHTML = '<div class="plays-empty">Waiting for game data\u2026</div>';
    return;
  }
  if (!container.querySelector(".wp-summary")) {
    container.innerHTML = '<div class="plays-empty">Loading win probability\u2026</div>';
  }
  const wpRaw = await fetchWinProb();
  if (!wpRaw || !wpRaw.length) {
    container.innerHTML = '<div class="plays-empty">Win probability not available yet</div>';
    return;
  }
  const playIdx = buildPlayIndex();
  const awayColor = g.away.color || "#d50a0a";
  const homeColor = g.home.color || "#013369";
  const latest = wpRaw[wpRaw.length - 1];
  const homeProbNow = Math.round((Number(latest?.homeWinPercentage) || 0.5) * 100);
  const awayProbNow = 100 - homeProbNow;
  const W = 520, H = 125;
  const PL = 36, PR = 16, PT = 10, PB = 22;
  const CW = W - PL - PR, CH = H - PT - PB;
  const stepX = CW / Math.max(1, wpRaw.length - 1);
  const midY = PT + CH / 2;
  const pts = wpRaw.map((d, i) => {
    const hp = (Number(d?.homeWinPercentage) || 0.5) * 100;
    const info = d?.playId != null ? playIdx.get(String(d.playId)) : void 0;
    return {
      x: PL + i * stepX,
      y: PT + CH / 2 + (hp - 50) / 50 * (CH / 2),
      homeProb: hp,
      awayProb: 100 - hp,
      text: info?.text || "",
      period: info?.period || 0
    };
  });
  const linePoints = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const polyPts = [`${PL},${midY}`, ...pts.map((p) => `${p.x},${p.y}`), `${PL + CW},${midY}`].join(" ");
  const light = document.documentElement.getAttribute("data-theme") === "light";
  const ink = light ? { mid: "rgba(10,24,40,0.30)", strong: "rgba(10,24,40,0.62)", label: "rgba(10,24,40,0.50)", grid: "rgba(10,24,40,0.10)", chartBg: "rgba(10,24,40,0.05)", dotFill: "#0a1828", dotRing: "rgba(10,24,40,0.6)" } : { mid: "rgba(255,255,255,0.30)", strong: "rgba(255,255,255,0.55)", label: "rgba(255,255,255,0.45)", grid: "rgba(255,255,255,0.08)", chartBg: "rgba(255,255,255,0.04)", dotFill: "#fff", dotRing: "rgba(255,255,255,0.6)" };
  let quarterLines = "";
  let lastQ = 0;
  pts.forEach((p) => {
    if (p.period && p.period !== lastQ) {
      lastQ = p.period;
      if (p.period > 1) {
        quarterLines += `<line x1="${p.x}" y1="${PT}" x2="${p.x}" y2="${PT + CH}" stroke="${ink.grid}" stroke-width="1" stroke-dasharray="3,3"/>`;
      }
      quarterLines += `<text x="${p.x + 3}" y="${PT + CH + 15}" font-size="8" fill="${ink.strong}" font-family="monospace">${periodLabel(p.period)}</text>`;
    }
  });
  const zones = pts.map((p, i) => {
    const prev = pts[i - 1];
    const next = pts[i + 1];
    const x = i === 0 ? PL : prev ? prev.x + (p.x - prev.x) / 2 : PL;
    const nx = i === pts.length - 1 ? PL + CW : next ? p.x + (next.x - p.x) / 2 : PL + CW;
    const per = p.period ? periodLabel(p.period) : "";
    return `<rect x="${x}" y="${PT}" width="${nx - x}" height="${CH}" class="wp-zone"
      data-x="${p.x}" data-y="${p.y}"
      data-home="${p.homeProb.toFixed(1)}" data-away="${p.awayProb.toFixed(1)}"
      data-desc="${escapeHtml(p.text)}" data-inn="${per}"/>`;
  }).join("");
  container.innerHTML = `
    <div class="wp-summary">
      <div class="wp-team wp-team-away">
        <span class="wp-team-logo">${logoHtml(g.away, "wp-team-logo")}</span>
        <span class="wp-team-pct" style="color:${awayColor}">${awayProbNow}%</span>
      </div>
      <div class="wp-title">WIN PROBABILITY</div>
      <div class="wp-team wp-team-home">
        <span class="wp-team-pct" style="color:${homeColor}">${homeProbNow}%</span>
        <span class="wp-team-logo">${logoHtml(g.home, "wp-team-logo")}</span>
      </div>
    </div>

    <div class="wp-prob-bar">
      <div class="wp-prob-bar-fill" style="width:${awayProbNow}%;background:${awayColor};"></div>
      <div class="wp-prob-bar-fill" style="width:${homeProbNow}%;background:${homeColor};"></div>
    </div>

    <div class="wp-chart-wrap">
      <div class="wp-tooltip" id="wp-tooltip"></div>
      <svg class="wp-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
        <rect x="${PL}" y="${PT}" width="${CW}" height="${CH}" fill="${ink.chartBg}" rx="2"/>
        <defs>
          <clipPath id="wp-clip-top"><rect x="${PL}" y="${PT}" width="${CW}" height="${CH / 2}"/></clipPath>
          <clipPath id="wp-clip-bot"><rect x="${PL}" y="${PT + CH / 2}" width="${CW}" height="${CH / 2}"/></clipPath>
        </defs>
        <polygon points="${polyPts}" fill="${awayColor}" opacity="0.9" clip-path="url(#wp-clip-top)"/>
        <polygon points="${polyPts}" fill="${homeColor}" opacity="0.9" clip-path="url(#wp-clip-bot)"/>
        <line x1="${PL}" y1="${midY}" x2="${PL + CW}" y2="${midY}" stroke="${ink.mid}" stroke-width="1" stroke-dasharray="4,3"/>
        <text x="${PL - 4}" y="${midY + 3}" text-anchor="end" font-size="8" fill="${ink.strong}" font-family="monospace">50%</text>
        <text x="${PL - 4}" y="${PT + 6}" text-anchor="end" font-size="8" fill="${awayColor}" font-family="monospace">${escapeHtml(g.away.abbr)}</text>
        <text x="${PL - 4}" y="${PT + CH + 2}" text-anchor="end" font-size="8" fill="${homeColor}" font-family="monospace">${escapeHtml(g.home.abbr)}</text>
        ${quarterLines}
        <polyline class="wp-line${wpAnimate ? " wp-draw" : ""}" pathLength="1" points="${linePoints}" fill="none" stroke="${ink.strong}" stroke-width="1.2" stroke-linejoin="round"/>
        ${zones}
        <circle id="wp-dot" cx="0" cy="0" r="4" fill="${ink.dotFill}" stroke="${ink.dotRing}" stroke-width="2" style="display:none;pointer-events:none;"/>
        <text x="${PL + CW / 2}" y="${H - 2}" text-anchor="middle" font-size="9" fill="${ink.label}" font-family="monospace">QUARTER</text>
      </svg>
    </div>

    <div class="wp-legend">
      <div class="wp-legend-item"><span class="wp-legend-swatch" style="background:${awayColor}"></span>${escapeHtml(g.away.name)}</div>
      <div class="wp-legend-item"><span class="wp-legend-swatch" style="background:${homeColor}"></span>${escapeHtml(g.home.name)}</div>
    </div>
  `;
  wireWinProbHover(g.away.abbr, g.home.abbr, awayColor, homeColor);
}
function wireWinProbHover(awayAbbr, homeAbbr, awayColor, homeColor) {
  const chart = document.querySelector(".wp-chart");
  const tooltip = $("wp-tooltip");
  const dot = document.getElementById("wp-dot");
  if (!chart || !tooltip || !dot) return;
  const showFor = (z) => {
    const ds = z.dataset;
    dot.setAttribute("cx", ds.x || "0");
    dot.setAttribute("cy", ds.y || "0");
    dot.style.display = "block";
    tooltip.innerHTML = `
      ${ds.inn ? `<div class="wp-tt-inn">${ds.inn}</div>` : ""}
      ${ds.desc ? `<div class="wp-tt-desc">${ds.desc}</div>` : ""}
      <div class="wp-tt-probs"><span style="color:${awayColor}">${awayAbbr} ${ds.away}%</span><span style="color:${homeColor}">${homeAbbr} ${ds.home}%</span></div>`;
    tooltip.style.display = "block";
  };
  const hide = () => {
    tooltip.style.display = "none";
    dot.style.display = "none";
  };
  chart.querySelectorAll(".wp-zone").forEach((zone) => {
    const z = zone;
    z.addEventListener("mouseenter", () => showFor(z));
    z.addEventListener("mouseleave", hide);
    z.addEventListener("click", (e) => {
      e.stopPropagation();
      showFor(z);
    });
  });
}
function setupWinProbDismiss() {
  document.addEventListener("click", (e) => {
    const tip = document.getElementById("wp-tooltip");
    if (!tip || tip.style.display === "none") return;
    const target = e.target;
    if (target?.closest(".wp-chart")) return;
    tip.style.display = "none";
    const dotEl = document.getElementById("wp-dot");
    if (dotEl) dotEl.style.display = "none";
  });
}
var standCache = null;
var standCacheTs = 0;
var standActiveLeague = "AFC";
async function fetchStandingsData() {
  const now = Date.now();
  if (standCache && now - standCacheTs < 12e4) return standCache;
  const res = await fetch("/api/standings");
  if (!res.ok) throw new Error("standings fetch failed");
  const data = await res.json();
  standCache = data;
  standCacheTs = now;
  return data;
}
function collectGroups(root) {
  const groups = [];
  const walk = (node) => {
    if (!node || typeof node !== "object") return;
    const entries = node.standings?.entries;
    if (Array.isArray(entries) && entries.length) {
      groups.push({ name: String(node.name || node.abbreviation || ""), entries });
    }
    (node.children || []).forEach(walk);
  };
  walk(root);
  return groups;
}
function statOf(entry, names) {
  const stats = entry?.stats || [];
  for (const s of stats) {
    if (names.indexOf(s?.name) >= 0 || names.indexOf(s?.abbreviation) >= 0) {
      return s.displayValue != null ? String(s.displayValue) : String(s.value ?? "");
    }
  }
  return "\u2014";
}
var NFL_DIVISIONS = {
  // AFC East / North / South / West
  "2": "AFC East",
  "15": "AFC East",
  "17": "AFC East",
  "20": "AFC East",
  "33": "AFC North",
  "4": "AFC North",
  "5": "AFC North",
  "23": "AFC North",
  "34": "AFC South",
  "11": "AFC South",
  "30": "AFC South",
  "10": "AFC South",
  "7": "AFC West",
  "12": "AFC West",
  "13": "AFC West",
  "24": "AFC West",
  // NFC East / North / South / West
  "6": "NFC East",
  "19": "NFC East",
  "21": "NFC East",
  "28": "NFC East",
  "3": "NFC North",
  "8": "NFC North",
  "9": "NFC North",
  "16": "NFC North",
  "1": "NFC South",
  "29": "NFC South",
  "18": "NFC South",
  "27": "NFC South",
  "22": "NFC West",
  "14": "NFC West",
  "25": "NFC West",
  "26": "NFC West"
};
var DIV_ORDER = ["East", "North", "South", "West"];
var standView = "standings";
function bracketSlot(label) {
  return `<div class="bk-slot"><span class="bk-seed">${escapeHtml(label)}</span><span class="bk-box"></span></div>`;
}
function bracketPair(a, b) {
  return `<div class="bk-pair">${bracketSlot(a)}${bracketSlot(b)}</div>`;
}
function buildBracketHtml(conf) {
  const col = (title, inner) => `<div class="bk-col"><div class="bk-col-hdr">${escapeHtml(title)}</div>${inner}</div>`;
  return `<div class="bracket-scroll"><div class="bracket">` + col("WILD CARD", bracketPair("2", "7") + bracketPair("3", "6") + bracketPair("4", "5")) + col("DIVISIONAL", bracketPair("1", "\u2014") + bracketPair("\u2014", "\u2014")) + col(`${escapeHtml(conf)} CHAMP`, bracketPair("\u2014", "\u2014")) + col("SUPER BOWL", `<div class="bk-pair bk-final">${bracketSlot("AFC")}${bracketSlot("NFC")}</div>`) + `</div></div>`;
}
async function loadStandingsView() {
  const body = $("stand-body");
  if (!body) return;
  body.innerHTML = '<div class="stand-msg">Loading\u2026</div>';
  try {
    const seg = `<div class="plays-toggle stand-view-toggle" style="--seg-i:${standView === "bracket" ? 1 : 0}"><span class="plays-toggle-thumb"></span><button class="plays-seg${standView === "standings" ? " is-active" : ""}" data-sv="standings" type="button">Standings</button><button class="plays-seg${standView === "bracket" ? " is-active" : ""}" data-sv="bracket" type="button">Bracket</button></div>`;
    if (standView === "bracket") {
      body.innerHTML = seg + buildBracketHtml(standActiveLeague);
    } else {
      const data = await fetchStandingsData();
      const groups = collectGroups(data).filter((grp) => grp.name.toUpperCase().includes(standActiveLeague) || grp.name.toUpperCase().includes(standActiveLeague === "AFC" ? "AMERICAN" : "NATIONAL"));
      const use = groups.length ? groups : collectGroups(data);
      if (!use.length) {
        body.innerHTML = seg + '<div class="stand-msg">No standings available.</div>';
      } else {
        const entries = use.flatMap((grp) => grp.entries);
        const byDiv = /* @__PURE__ */ new Map();
        entries.forEach((e) => {
          const id = String(e?.team?.id ?? "");
          const div = NFL_DIVISIONS[id] || "";
          if (!div.startsWith(standActiveLeague)) return;
          const list = byDiv.get(div) || [];
          list.push(e);
          byDiv.set(div, list);
        });
        const cards = DIV_ORDER.map((d) => {
          const name = `${standActiveLeague} ${d}`;
          const list = byDiv.get(name) || [];
          if (!list.length) return "";
          const rows = list.map((e, i) => {
            const t = e?.team || {};
            const team = {
              id: String(t.id ?? ""),
              abbr: String(t.abbreviation || "").toUpperCase(),
              name: String(t.displayName || ""),
              nick: String(t.name || ""),
              record: "",
              score: 0,
              color: "",
              logo: ""
            };
            return `<div class="stand-row${i === 0 ? " leader" : ""}"><span class="stand-pos${i === 0 ? " first" : ""}">${i + 1}</span><span class="stand-team">${logoImg(team, "stand-logo")}<span class="stand-abbr">${escapeHtml(team.abbr.slice(0, 4))}</span></span><span class="stand-stat">${escapeHtml(statOf(e, ["wins", "W"]))}</span><span class="stand-stat">${escapeHtml(statOf(e, ["losses", "L"]))}</span><span class="stand-stat muted">${escapeHtml(statOf(e, ["ties", "T"]))}</span><span class="stand-pct"><span class="stand-pct-val">${escapeHtml(statOf(e, ["winPercent", "PCT"]))}</span></span></div>`;
          }).join("");
          return `<div class="stand-card"><div class="stand-card-hdr"><span class="stand-card-dot"></span><span class="stand-card-name">${escapeHtml(name)}</span></div><div class="stand-col-hdr"><span>#</span><span class="stand-col-team">Team</span><span>W</span><span>L</span><span>T</span><span class="stand-col-pct">PCT</span></div>` + rows + `</div>`;
        }).join("");
        body.innerHTML = seg + (cards || '<div class="stand-msg">No standings available.</div>');
      }
    }
    body.querySelectorAll(".stand-view-toggle .plays-seg").forEach((s) => {
      s.addEventListener("click", () => {
        const v = s.getAttribute("data-sv");
        if (v === "standings" || v === "bracket") {
          standView = v;
          void loadStandingsView();
        }
      });
    });
  } catch (e) {
    reportError("loadStandingsView", e);
    body.innerHTML = '<div class="stand-msg">Could not load standings.</div>';
  }
}
function setStandLeague(lg) {
  standActiveLeague = lg;
  const nav = $("stand-nav");
  if (nav) {
    nav.setAttribute("data-active", lg);
    nav.querySelectorAll(".stand-seg").forEach((s) => s.classList.toggle("is-active", s.getAttribute("data-league") === lg));
  }
  void loadStandingsView();
}
function setupStandings() {
  const nav = $("stand-nav");
  if (!nav) return;
  nav.querySelectorAll(".stand-seg").forEach((seg) => {
    seg.addEventListener("click", () => {
      const lg = seg.getAttribute("data-league");
      if (lg) setStandLeague(lg);
    });
  });
}
function payloadSignature(s) {
  const c = s?.header?.competitions?.[0] || {};
  const st = c?.status || {};
  const comps = c?.competitors || [];
  const drives = s?.drives;
  const cur = drives?.current;
  const curPlays = cur?.plays || [];
  const lastPlay = curPlays[curPlays.length - 1];
  return [
    st?.type?.name,
    st?.period,
    st?.displayClock,
    comps.map((x) => `${x?.id}:${x?.score}`).join(","),
    (drives?.previous || []).length,
    curPlays.length,
    lastPlay?.id,
    cur?.yards,
    cur?.team?.id,
    (s?.scoringPlays || []).length,
    (s?.videos || []).length,
    (s?.winprobability || []).length,
    (s?.injuries || []).reduce((n, gp) => n + (gp?.injuries || []).length, 0),
    (s?.pickcenter || [])[0]?.details
  ].join("|");
}
function render(summary) {
  const sig = payloadSignature(summary);
  const unchanged = sig === lastRenderSig && !firstRender;
  lastSummary = summary;
  if (unchanged) return;
  lastRenderSig = sig;
  firstRender = false;
  const g = normalize(summary);
  if (!g) {
    reportError("normalize", "unreadable summary");
    return;
  }
  lastGame = g;
  const isPostponed = postType === "postponed" || isPostponedName(g.statusName);
  const phase = isPostponed ? "post" : g.phase;
  document.body.classList.toggle("is-pregame", phase === "pre");
  document.body.classList.toggle("is-live", phase === "in");
  document.body.classList.toggle("is-final", phase === "post");
  void maybeNotifyPostgame(g);
  const loading = $("loading-state");
  const content = $("scorebug-content");
  if (loading) loading.style.display = "none";
  if (content) content.style.display = "";
  const venueEl = $("venue-info");
  if (venueEl) {
    const venueName = String(g.venue?.fullName || "");
    let when = "";
    try {
      const dt = new Date(g.date);
      when = dt.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase() + " \xB7 " + formatGameTime(g.date);
    } catch {
    }
    venueEl.textContent = [venueName.toUpperCase(), when].filter(Boolean).join(" \xB7 ");
  }
  const ctxEl = $("game-context");
  if (ctxEl) ctxEl.textContent = gameContextLabel(g);
  setLogoHolder("away-logo-holder", g.away, "team-logo");
  setLogoHolder("home-logo-holder", g.home, "team-logo");
  const an = $("away-name"), hn = $("home-name");
  if (an) an.textContent = g.away.name;
  if (hn) hn.textContent = g.home.name;
  const ar = $("away-record"), hr = $("home-record");
  if (ar) ar.textContent = g.away.record;
  if (hr) hr.textContent = g.home.record;
  const awayWrap = $("away-logo-holder"), homeWrap = $("home-logo-holder");
  if (awayWrap) awayWrap.style.setProperty("--wash", railColorOf(g.away, "#d50a0a"));
  if (homeWrap) homeWrap.style.setProperty("--wash", railColorOf(g.home, "#013369"));
  const as = $("away-score"), hs = $("home-score");
  const bump = (el, v) => {
    if (!el) return;
    if (el.textContent !== v && el.textContent !== "") {
      el.classList.remove("score-bump");
      void el.offsetWidth;
      el.classList.add("score-bump");
    }
    el.textContent = v;
  };
  bump(as, String(g.away.score));
  bump(hs, String(g.home.score));
  const badge = $("status-badge");
  const clock = $("inning-info");
  const possEl = $("poss-text");
  const sit = phase === "in" ? parseSituation(summary, g) : null;
  hideAllStatePanes();
  const dyn = $("dynamic-tab-label");
  if (isPostponed) {
    if (badge) {
      badge.textContent = "POSTPONED";
    }
    if (clock) clock.textContent = "";
    if (possEl) possEl.textContent = "";
    if (dyn) dyn.textContent = "POSTPONED";
    const pane = $("postponed-content");
    if (pane) pane.style.display = "block";
    try {
      renderPostponed(g);
    } catch (e) {
      reportError("renderPostponed", e);
    }
  } else if (phase === "post") {
    if (badge) badge.textContent = "FINAL";
    if (clock) clock.textContent = g.period > 4 ? "F/OT" : "";
    if (possEl) possEl.textContent = "";
    if (dyn) dyn.textContent = "WRAP";
    const pane = $("final-content");
    if (pane) pane.style.display = "block";
    try {
      renderFinal(g);
    } catch (e) {
      reportError("renderFinal", e);
    }
  } else if (phase === "pre") {
    if (badge) badge.textContent = "";
    if (clock) clock.textContent = formatGameTime(g.date);
    if (possEl) possEl.textContent = "";
    if (dyn) dyn.textContent = "MATCHUP";
    const pane = $("pregame-content");
    if (pane) pane.style.display = "block";
    try {
      renderPregame(g);
    } catch (e) {
      reportError("renderPregame", e);
    }
  } else {
    if (badge) badge.textContent = "LIVE";
    if (clock) {
      let clk = g.displayClock, per = g.period;
      if (!clk || !per) {
        const lp = lastPlayOf(summary);
        if (lp) {
          if (!clk && lp.clock?.displayValue) clk = String(lp.clock.displayValue);
          if (!per && lp.period?.number) per = Number(lp.period.number);
        }
      }
      clock.textContent = `${clk || ""} ${periodLabel(per || 0)}`.trim() || "IN PROGRESS";
    }
    if (possEl) possEl.textContent = sit?.possText ? `BALL ON ${sit.possText.toUpperCase()}` : "";
    if (dyn) dyn.textContent = "LIVE";
    const pane = $("live-content");
    if (pane) pane.style.display = "block";
    if (!fieldBuilt) {
      buildFieldStatics(g);
      fieldBuilt = true;
    }
    const sitEl = $("situation");
    if (sitEl) {
      const show = !!(sit && sit.ddText);
      sitEl.style.display = show ? "" : "none";
      if (show) {
        const dd = $("sit-dd"), spot = $("sit-spot");
        if (dd) dd.textContent = sit.ddText;
        if (spot) spot.textContent = sit.possText || "\u2014";
      }
    }
    try {
      renderField(summary, g, sit);
    } catch (e) {
      reportError("renderField", e);
    }
  }
  try {
    renderLinescore(g);
  } catch (e) {
    reportError("renderLinescore", e);
  }
  if ($("tab-box")?.classList.contains("tab-content-active")) {
    try {
      renderStatsTab();
    } catch (e) {
      reportError("renderStatsTab", e);
    }
  }
  if ($("tab-plays")?.classList.contains("tab-content-active")) {
    try {
      renderPlaysTab();
    } catch (e) {
      reportError("renderPlaysTab", e);
    }
  }
  if ($("tab-winprob")?.classList.contains("tab-content-active")) {
    void renderWinProb();
  }
  if (phase === "post") {
    gameIsTerminal = true;
    stopPolling();
  }
}
function setupTabs() {
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetTab = btn.dataset.tab;
      if (!targetTab) return;
      document.body.classList.toggle("on-game-tab", targetTab === "game");
      document.body.classList.toggle("on-box-tab", targetTab === "box");
      document.body.classList.toggle("on-standings-tab", targetTab === "standings");
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("tab-active"));
      btn.classList.add("tab-active");
      document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("tab-content-active"));
      $(`tab-${targetTab}`)?.classList.add("tab-content-active");
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      const region = inlinePagerRegion();
      if (region) region.scrollTop = 0;
      if (targetTab === "box" && lastSummary) {
        statsAnimate = true;
        try {
          renderStatsTab();
        } catch (e) {
          reportError("renderStatsTab", e);
        }
      }
      if (targetTab === "plays") {
        playsAnimate = true;
        if (lastSummary) {
          try {
            renderPlaysTab();
          } catch (e) {
            reportError("renderPlaysTab", e);
          }
        }
        setPlaysView("scoring");
      }
      if (targetTab === "winprob") {
        wpAnimate = true;
        void renderWinProb();
      }
      if (targetTab === "standings") {
        setStandLeague(standActiveLeague);
      }
    });
  });
}
function pollDelayMs() {
  const g = lastGame;
  if (!g) return 1e4;
  if (g.phase === "in") return 1e4;
  if (g.phase === "post") return 6e4;
  const mins = (new Date(g.date).getTime() - Date.now()) / 6e4;
  if (!isFinite(mins)) return 6e4;
  if (mins <= 5) return 15e3;
  if (mins <= 30) return 6e4;
  return 18e4;
}
function scheduleNextPoll() {
  if (pollInterval) clearTimeout(pollInterval);
  pollInterval = setTimeout(() => {
    void (async () => {
      if (lastGame?.phase === "post") {
        finalPollsDone++;
        if (finalPollsDone > 3) {
          stopPolling();
          return;
        }
      }
      if (!document.hidden && eventId != null) await fetchAndRender(eventId);
      scheduleNextPoll();
    })();
  }, pollDelayMs());
}
function startPolling() {
  finalPollsDone = 0;
  scheduleNextPoll();
}
function stopPolling() {
  if (pollInterval) {
    clearTimeout(pollInterval);
    pollInterval = null;
  }
}
async function maybeNotifyPostgame(g) {
  if (postgameNotificationFired) return;
  if (g.phase !== "post") return;
  postgameNotificationFired = true;
  try {
    await fetch("/api/postgame-check", { method: "POST" });
  } catch (e) {
    console.error("postgame notify failed:", e);
  }
}
async function selectGameForThisPost() {
  try {
    const res = await fetch("/api/post-game");
    if (res.ok) {
      const data = await res.json();
      if (data?.postType) postType = String(data.postType);
      if (data?.eventId) return String(data.eventId);
    }
  } catch {
  }
  return null;
}
function renderEndedState() {
  const host = $("loading-state");
  if (!host) return;
  host.innerHTML = `
    <div class="ended-display">
      <div class="ended-headline">Scoreboard Unavailable</div>
      <div class="ended-divider"></div>
      <div class="ended-text">This thread isn't linked to a game yet.</div>
      <div id="pick-game" class="pick-wrap"></div>
    </div>`;
  void offerGamePicker();
}
async function offerGamePicker() {
  const box = $("pick-game");
  if (!box) return;
  const days = [];
  for (let i = 0; i < 8; i++) {
    const d = new Date(Date.now() - i * 864e5);
    days.push(d.toISOString().slice(0, 10));
  }
  const found = [];
  const diag = [];
  for (const day of days) {
    if (found.length >= 12) break;
    for (const st of ["", "1", "3"]) {
      let events = [];
      try {
        const res = await fetch(`/api/schedule?date=${day}${st ? `&st=${st}` : ""}`);
        if (!res.ok) {
          let why = "";
          try {
            const body = await res.text();
            try {
              why = String(JSON.parse(body)?.error || "").slice(0, 140);
            } catch {
              why = body.slice(0, 140);
            }
          } catch {
          }
          if (diag.length < 2) diag.push(`HTTP ${res.status}${why ? `: ${why}` : ""}`);
          continue;
        }
        const data = await res.json();
        events = data?.events || [];
      } catch (e) {
        if (diag.length < 3) diag.push(`${day.slice(5)}: fetch threw`);
        continue;
      }
      if (events.length) console.log(`schedule ${day} st=${st || "-"}: ${events.length} events`);
      for (const ev of events) {
        const comp = ev?.competitions?.[0];
        const cs = comp?.competitors || [];
        const h = cs.find((c) => c?.homeAway === "home")?.team?.abbreviation || "";
        const a = cs.find((c) => c?.homeAway === "away")?.team?.abbreviation || "";
        if (!h || !a) continue;
        if (!found.some((f) => f.id === String(ev.id))) {
          found.push({ id: String(ev.id), label: `${a} @ ${h} \xB7 ${day.slice(5)}` });
        }
      }
      if (events.length) break;
    }
  }
  if (!found.length) {
    const why = diag.length ? diag.join(" \xB7 ") : "all slates came back empty";
    box.innerHTML = `<div class="pick-note">No recent games found to link.</div><div class="pick-note pick-diag">(${escapeHtml(why)})</div>`;
    return;
  }
  box.innerHTML = '<div class="pick-note">Pick the game this thread is for:</div>' + found.slice(0, 12).map(
    (f) => `<button class="pick-btn" type="button" data-ev="${escapeHtml(f.id)}">${escapeHtml(f.label)}</button>`
  ).join("");
  box.querySelectorAll(".pick-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-ev");
      if (!id) return;
      eventId = id;
      const loading = $("loading-state");
      if (loading) loading.innerHTML = '<div class="loading-spinner"></div><div class="loading-text">Loading scoreboard\u2026</div>';
      void fetchAndRender(id).then(() => {
        if (!gameIsTerminal) startPolling();
      });
    });
  });
}
async function fetchAndRender(id) {
  try {
    const res = await fetch(`/api/game/${id}`);
    const data = await res.json();
    if (!data?.header) {
      console.error("Game data unavailable");
      return;
    }
    render(data);
  } catch (e) {
    console.error("fetchAndRender error:", e);
  }
}
(async () => {
  document.body.classList.add("on-game-tab");
  setupTabs();
  setupPlaysToggle();
  setupWinProbDismiss();
  setupThemeToggle();
  setupExpand();
  setupGraphButton();
  setupTvButton();
  setupStandings();
  setupInlinePager();
  $("replay-play-btn")?.addEventListener("click", replayLastPlay);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && pollInterval !== null && eventId != null) {
      void fetchAndRender(eventId);
    }
  });
  eventId = await selectGameForThisPost();
  if (!eventId) {
    renderEndedState();
    return;
  }
  await fetchAndRender(eventId);
  if (!gameIsTerminal) startPolling();
})();
//# sourceMappingURL=game.js.map
