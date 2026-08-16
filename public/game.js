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
  const local = `/teams/${encodeURIComponent(team.id)}.svg`;
  const cdn = escapeHtml(team.logo || "");
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
  const active = document.querySelector(".tab-content.tab-content-active");
  if (!active) return null;
  return active.querySelector(".bs-panel-wrap") || active;
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
  btn.style.cssText = "position:absolute;top:10px;right:12px;z-index:40;width:25px;height:25px;display:flex;align-items:center;justify-content:center;padding:0;background:var(--bg-elev-2);color:var(--text-primary);border:1px solid var(--border-medium);border-radius:6px;cursor:pointer;-webkit-tap-highlight-color:transparent;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);";
  let modePoll = 0;
  const sync = () => {
    const expanded = isExpandedMode();
    btn.style.display = expanded ? "none" : "flex";
    document.body.classList.toggle("is-inline", !expanded);
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
    sync();
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
function systemTheme() {
  try {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  } catch {
    return "dark";
  }
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
  return savedTheme() ?? systemTheme();
}
function setupThemeToggle() {
  if (document.getElementById("theme-btn")) return;
  const host = $("scorebug-content") || document.body;
  let theme = resolveTheme();
  applyTheme(theme);
  const btn = document.createElement("button");
  btn.id = "theme-btn";
  btn.type = "button";
  btn.style.cssText = "position:absolute;top:10px;left:12px;z-index:40;width:25px;height:25px;display:flex;align-items:center;justify-content:center;padding:0;background:var(--bg-elev-2);color:var(--text-primary);border:1px solid var(--border-medium);border-radius:6px;cursor:pointer;-webkit-tap-highlight-color:transparent;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);";
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
  try {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onSchemeChange = (e) => {
      try {
        localStorage.removeItem(THEME_KEY);
      } catch {
      }
      theme = e.matches ? "dark" : "light";
      applyTheme(theme);
      paint();
      try {
        if (lastSummary) render(lastSummary);
      } catch (err) {
        reportError("scheme re-render", err);
      }
    };
    if (mq.addEventListener) mq.addEventListener("change", onSchemeChange);
    else if (mq.addListener) mq.addListener(onSchemeChange);
  } catch {
  }
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
    const visual = it.img ? `<img class="info-row-logo" src="${it.img}" alt="">` : it.icon ? `<span class="info-row-icon">${it.icon}</span>` : "";
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
  b.style.cssText = "position:absolute;top:10px;" + side + ":" + offsetPx + "px;z-index:40;width:25px;height:25px;display:flex;align-items:center;justify-content:center;padding:0;background:var(--bg-elev-2);color:var(--text-primary);border:1px solid var(--border-medium);border-radius:6px;cursor:pointer;-webkit-tap-highlight-color:transparent;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);";
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
function ballUnit(sit) {
  if (sit.yardsToEndzone == null) return null;
  if (sit.possIsHome) return 10 + sit.yardsToEndzone;
  if (sit.possIsAway) return 110 - sit.yardsToEndzone;
  return null;
}
function firstDownUnit(sit) {
  const b = ballUnit(sit);
  if (b == null || sit.distance == null) return null;
  if (sit.possIsHome) return Math.max(10, b - sit.distance);
  if (sit.possIsAway) return Math.min(110, b + sit.distance);
  return null;
}
var unitPct = (u) => u / 120 * 100 + "%";
function buildFieldStatics(g) {
  const plane = $("fieldplane");
  if (!plane) return;
  for (let u = 20; u <= 100; u += 10) {
    const l = document.createElement("div");
    l.className = "yline" + (u === 60 ? " mid" : "");
    l.style.left = unitPct(u);
    plane.insertBefore(l, plane.firstChild);
  }
  const ezLZone = $("ez-left-zone"), ezRZone = $("ez-right-zone");
  const ezL = $("ez-left"), ezR = $("ez-right");
  if (ezL) ezL.textContent = (g.away.nick || g.away.abbr).toUpperCase();
  if (ezR) ezR.textContent = (g.home.nick || g.home.abbr).toUpperCase();
  if (ezLZone) ezLZone.style.background = g.away.color || "#5b6474";
  if (ezRZone) ezRZone.style.background = g.home.color || "#5b6474";
  const strip = $("yard-nums");
  if (strip) {
    strip.innerHTML = "";
    const labels = [
      { t: g.away.abbr, minor: false },
      { t: "10", minor: true },
      { t: "20", minor: false },
      { t: "30", minor: true },
      { t: "40", minor: true },
      { t: "50", minor: false },
      { t: "40", minor: true },
      { t: "30", minor: true },
      { t: "20", minor: false },
      { t: "10", minor: true },
      { t: g.home.abbr, minor: false },
      { t: "", minor: true }
    ];
    labels.forEach((l) => {
      const s = document.createElement("span");
      s.textContent = l.t;
      if (l.minor) s.className = "minor";
      strip.appendChild(s);
    });
  }
}
var SVG_W = 1200;
var SVG_H = 92;
var unitX = (u) => u / 120 * SVG_W;
function isAirPlay(p) {
  const t = String(p?.type?.text || p?.type?.abbreviation || "").toLowerCase();
  if (/sack|kneel|rush|run/.test(t)) return false;
  return /pass|punt|kick|field goal|interception|reception/.test(t);
}
function playUnits(p, offenseIsHome) {
  const s = numOrNull(p?.start?.yardsToEndzone);
  const e = numOrNull(p?.end?.yardsToEndzone);
  if (s == null || e == null) return null;
  const toUnit = (ytg) => offenseIsHome ? 10 + ytg : 110 - ytg;
  return { x1: toUnit(s), x2: toUnit(e) };
}
function segPath(x1, x2, air) {
  const y = SVG_H * 0.56;
  const a = unitX(x1), b = unitX(x2);
  if (!air || Math.abs(b - a) < 6) return `M ${a} ${y} L ${b} ${y}`;
  const peak = Math.max(16, SVG_H * 0.56 - Math.min(34, Math.abs(b - a) * 0.1));
  return `M ${a} ${y} Q ${(a + b) / 2} ${SVG_H * 0.56 - (SVG_H * 0.56 - peak) * 2} ${b} ${y}`;
}
function renderDrivePath(summary, g, sit) {
  const svg = $("drive-svg");
  if (!svg) return;
  const drive = summary?.drives?.current || (summary?.drives?.previous?.length ? summary.drives.previous[summary.drives.previous.length - 1] : null);
  const plays = (drive?.plays || []).filter((p) => !/kickoff/i.test(String(p?.type?.text || ""))).slice(-12);
  const offenseIsHome = drive?.team?.id != null ? String(drive.team.id) === g.home.id : !!sit?.possIsHome;
  let out = "";
  const n = plays.length;
  plays.forEach((p, i) => {
    const u = playUnits(p, offenseIsHome);
    if (!u || u.x1 === u.x2 && i < n - 1) return;
    const latest = i === n - 1;
    const color = p?.isPenalty ? "var(--penalty-yellow)" : "var(--play-ink)";
    const dash = latest ? ' stroke-dasharray="7 6"' : "";
    out += `<path d="${segPath(u.x1, u.x2, isAirPlay(p))}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"${dash}/>`;
  });
  const head = sit ? ballUnit(sit) : null;
  if (head != null) {
    const hx = unitX(head), y = SVG_H * 0.56;
    const d = offenseIsHome ? -1 : 1;
    out += `<path d="M ${hx + d * 12} ${y - 6} L ${hx + d * 22} ${y} L ${hx + d * 12} ${y + 6} Z" fill="var(--play-ink)"/>`;
  }
  svg.innerHTML = out;
}
function renderDriveHeader(summary, g, sit) {
  const hdr = $("drive-hdr");
  if (!hdr) return;
  const drive = summary?.drives?.current;
  if (!drive) {
    hdr.style.display = "none";
    return;
  }
  const offense = String(drive?.team?.id) === g.home.id ? g.home : String(drive?.team?.id) === g.away.id ? g.away : sit?.possIsHome ? g.home : g.away;
  const meta = [
    `${(drive?.plays || []).length} plays`,
    drive?.yards != null ? `${drive.yards} yards` : "",
    drive?.timeElapsed?.displayValue || ""
  ].filter(Boolean).join(", ");
  const logoEl = $("dh-logo");
  if (logoEl) logoEl.innerHTML = logoHtml(offense, "dh-logo-img");
  const metaEl = $("dh-meta");
  if (metaEl) metaEl.textContent = meta;
  hdr.style.display = "";
}
function renderField(summary, g, sit) {
  const first = $("first-line"), pin = $("poss-pin"), lp = $("last-play");
  if (!first || !pin || !lp) return;
  const b = sit ? ballUnit(sit) : null;
  if (b == null) {
    pin.style.display = "none";
    first.style.display = "none";
  } else {
    const team = sit.possIsHome ? g.home : g.away;
    pin.innerHTML = logoHtml(team, "pin-logo");
    pin.style.left = unitPct(b);
    pin.style.display = "flex";
    const f = firstDownUnit(sit);
    if (f != null) {
      first.style.left = unitPct(f);
      first.style.display = "";
    } else first.style.display = "none";
  }
  renderDrivePath(summary, g, sit);
  renderDriveHeader(summary, g, sit);
  const lastP = lastPlayOf(summary);
  const pill = $("penalty-pill");
  if (pill) pill.classList.toggle("on", lastP?.isPenalty === true);
  if (sit?.lastPlayText) {
    const title = String(lastP?.type?.text || "Last Play");
    lp.innerHTML = `<div class="lp-head"><span class="lp-title">${escapeHtml(title)}</span><span class="lp-chip">LAST PLAY</span></div>` + escapeHtml(sit.lastPlayText);
    lp.style.display = "";
  } else lp.style.display = "none";
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
      if (!has) cls += " ls-empty";
      else if (v === 0) cls += " ls-zero";
      else cls += " ls-nonzero";
      if (i === g.period && g.phase === "in") cls += " ls-current";
      cells += `<td class="${cls}">${has ? v : "\u2013"}</td>`;
    }
    cells += `<td class="ls-total ls-r-value ${t.score === 0 ? "ls-zero" : "ls-nonzero"}">${t.score}</td>`;
    return `<tr class="${loser ? "ls-row-loser" : ""}">${cells}</tr>`;
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
function kvRow(k, v) {
  return `<div class="drive-card" style="display:flex;justify-content:space-between;gap:10px;align-items:center"><span class="drive-meta" style="margin:0">${k}</span><span style="font-size:13px;text-align:right">${v}</span></div>`;
}
function networksOf(g) {
  return (g.broadcasts || []).map((b) => {
    if (b?.media?.shortName) return String(b.media.shortName);
    if (Array.isArray(b?.names) && b.names.length) return b.names.join(", ");
    return "";
  }).filter(Boolean).join(" \xB7 ");
}
function renderPregame(g) {
  const body = $("pregame-body");
  if (!body) return;
  let when = "";
  try {
    when = new Date(g.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase() + "  \xB7  " + formatGameTime(g.date);
  } catch {
  }
  const nets = networksOf(g);
  let html = kvRow("KICKOFF", escapeHtml(when));
  if (nets) html += kvRow("TV", escapeHtml(nets));
  if (g.venue?.fullName) {
    const loc = g.venue.address ? [g.venue.address.city, g.venue.address.state].filter(Boolean).join(", ") : "";
    html += kvRow("VENUE", escapeHtml(String(g.venue.fullName)) + (loc ? " \u2014 " + escapeHtml(loc) : ""));
  }
  html += kvRow(escapeHtml(g.away.abbr), escapeHtml(g.away.record || "\u2014"));
  html += kvRow(escapeHtml(g.home.abbr), escapeHtml(g.home.record || "\u2014"));
  body.innerHTML = html;
}
function renderFinal(g) {
  const body = $("final-body");
  if (!body) return;
  const tie = g.home.score === g.away.score;
  const winner = tie ? null : g.home.score > g.away.score ? g.home : g.away;
  const headline = winner ? `${escapeHtml(winner.name)} win, ${Math.max(g.home.score, g.away.score)}\u2013${Math.min(g.home.score, g.away.score)}` : `Tie game, ${g.home.score}\u2013${g.away.score}`;
  let html = `<div class="ended-display" style="padding:14px 0 4px"><div class="ended-headline">${headline}</div><div class="ended-divider"></div><div class="ended-text">${escapeHtml(g.statusDetail || "Final")}${g.venue?.fullName ? " \xB7 " + escapeHtml(String(g.venue.fullName)) : ""}</div></div>`;
  html += `<div id="final-scoring"></div><div class="clips-grid" id="final-clips"></div>`;
  body.innerHTML = html;
  const fs = $("final-scoring");
  if (fs) fs.innerHTML = buildScoringCards(true);
  void loadClipsInto("final-clips");
}
function renderPostponed(g) {
  const body = $("postponed-body");
  if (!body) return;
  const detail = g.statusDetail && !/^postponed$/i.test(g.statusDetail.trim()) ? g.statusDetail : "";
  body.innerHTML = `<div class="ended-display" style="padding:14px 0 4px"><div class="ended-headline">Postponed</div><div class="ended-divider"></div><div class="ended-text">${escapeHtml(g.away.name)} at ${escapeHtml(g.home.name)}` + (detail ? `<br>${escapeHtml(detail)}` : "") + `</div></div>`;
}
function buildLeadersHtml() {
  const L = lastSummary?.leaders || [];
  if (!L.length) return "";
  let rows = "";
  L.forEach((side) => {
    const abbr = side?.team?.abbreviation || "";
    (side?.leaders || []).forEach((cat) => {
      const top = cat?.leaders?.[0];
      if (!top) return;
      const nm = top.athlete?.displayName || "";
      const label = String(cat.displayName || cat.name || "").replace(/Yards$/, "");
      rows += `<tr><td>${escapeHtml(abbr)} ${escapeHtml(label)}</td><td>${escapeHtml(nm)}</td><td>${escapeHtml(String(top.displayValue || ""))}</td></tr>`;
    });
  });
  if (!rows) return "";
  return `<div class="bs-section-hdr"><span class="bs-dot"></span>Leaders</div><table class="leaders-table"><tbody>${rows}</tbody></table>`;
}
function buildTeamStatsHtml(g) {
  const bteams = lastSummary?.boxscore?.teams || [];
  if (bteams.length !== 2) return "";
  let a = bteams[0], h = bteams[1];
  if (String(a?.team?.id) === g.home.id) {
    const t = a;
    a = h;
    h = t;
  }
  const rows = {};
  (a?.statistics || []).forEach((st) => {
    rows[st.name] = { label: st.label || st.name, a: st.displayValue };
  });
  (h?.statistics || []).forEach((st) => {
    rows[st.name] = rows[st.name] || { label: st.label || st.name };
    rows[st.name].h = st.displayValue;
  });
  let body = "";
  Object.keys(rows).forEach((k) => {
    const r = rows[k];
    body += `<tr><td class="bs-player">${escapeHtml(r.label)}</td><td>${escapeHtml(r.a || "\u2014")}</td><td>${escapeHtml(r.h || "\u2014")}</td></tr>`;
  });
  return `<div class="bs-section-hdr"><span class="bs-dot"></span>Team stats</div><table class="bs-table"><thead><tr><th class="bs-th-player"></th><th>${escapeHtml(g.away.abbr)}</th><th>${escapeHtml(g.home.abbr)}</th></tr></thead><tbody>${body}</tbody></table>`;
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
  if (!g) return;
  const leadersEl = $("leaders-box");
  if (leadersEl) leadersEl.innerHTML = buildLeadersHtml() + buildTeamStatsHtml(g);
  const aa = $("bs-away-tab-abbr"), ha = $("bs-home-tab-abbr");
  if (aa) aa.textContent = g.away.abbr || "AWAY";
  if (ha) ha.textContent = g.home.abbr || "HOME";
  setLogoHolder("bs-away-tab-logo", g.away, "bs-team-tab-logo");
  setLogoHolder("bs-home-tab-logo", g.home, "bs-team-tab-logo");
  const wrap = document.querySelector(".bs-panel-wrap");
  const saved = wrap?.scrollTop ?? 0;
  const ap = $("bs-away-panel"), hp = $("bs-home-panel");
  if (ap) ap.innerHTML = buildPlayerPanel(g.away.id);
  if (hp) hp.innerHTML = buildPlayerPanel(g.home.id);
  if (wrap) wrap.scrollTop = saved;
}
function setupBoxScoreTeamTabs() {
  document.querySelectorAll(".bs-team-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const team = btn.dataset.bsTeam;
      if (!team) return;
      document.querySelectorAll(".bs-team-tab").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".bs-panel").forEach((p) => p.classList.remove("active"));
      $(`bs-${team}-panel`)?.classList.add("active");
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      const wrap = document.querySelector(".bs-panel-wrap");
      if (wrap) wrap.scrollTop = 0;
    });
  });
}
function buildScoringCards(compact) {
  const g = lastGame;
  const sp = lastSummary?.scoringPlays || [];
  if (!g || !sp.length) return '<div class="plays-empty">No scoring plays yet</div>';
  return [...sp].reverse().map((p) => {
    const abbr = p?.team?.abbreviation || "";
    const stype = p?.scoringType?.abbreviation || p?.scoringType?.displayName || p?.type?.abbreviation || "";
    const per = p?.period?.number ? periodLabel(Number(p.period.number)) : "";
    const clk = p?.clock?.displayValue || "";
    return `<div class="play-card"><div class="play-main"><div class="play-header"><span class="play-inning sp-when">${escapeHtml(per)} ${escapeHtml(clk)}</span><span class="play-event-badge">${escapeHtml(String(stype).toUpperCase() || "SCORE")}</span><span class="play-event-text">${escapeHtml(abbr)}</span></div><div class="play-desc">${escapeHtml(String(p?.text || ""))}</div><div class="sp-scoreline">${escapeHtml(g.away.abbr)} ${Number(p?.awayScore) || 0} \u2014 ${escapeHtml(g.home.abbr)} ${Number(p?.homeScore) || 0}</div></div></div>`;
  }).join("");
}
function driveResultClass(result) {
  if (/TD|FG|SCORE/i.test(result)) return "score";
  if (/INT|FUMBLE|DOWNS|TURNOVER/i.test(result)) return "turnover";
  if (/PROGRESS/i.test(result)) return "progress";
  return "";
}
function buildDriveCards() {
  const s = lastSummary || {};
  const list = [];
  if (s.drives?.current) list.push({ d: s.drives.current, current: true });
  const prev = s.drives?.previous || [];
  for (let i = prev.length - 1; i >= 0; i--) list.push({ d: prev[i], current: false });
  if (!list.length) return '<div class="plays-empty">No drives yet</div>';
  return list.map((w, idx) => {
    const d = w.d;
    const team = d?.team?.abbreviation || d?.team?.displayName || "";
    const result = String(d?.displayResult || d?.result || (w.current ? "IN PROGRESS" : ""));
    const meta = [
      d?.offensivePlays != null ? `${d.offensivePlays} plays` : "",
      d?.yards != null ? `${d.yards} yds` : "",
      d?.timeElapsed?.displayValue || ""
    ].filter(Boolean).join(" \xB7 ");
    let playsHtml = "";
    const plays = d?.plays || [];
    if ((w.current || idx === 0) && plays.length) {
      playsHtml = '<div class="drive-plays">' + plays.slice(-8).map((p) => {
        const dd = p?.start?.downDistanceText || p?.start?.shortDownDistanceText || "";
        return `<div class="p">${dd ? `<div class="pdd">${escapeHtml(dd)}</div>` : ""}${escapeHtml(String(p?.text || ""))}</div>`;
      }).join("") + "</div>";
    }
    return `<div class="drive-card${w.current ? " current" : ""}"><div class="drive-head"><span class="drive-who">${escapeHtml(team)}</span><span class="drive-result ${driveResultClass(result)}${w.current ? " progress" : ""}">${escapeHtml(result)}</span></div><div class="drive-meta">${escapeHtml(meta)}${d?.description ? " \u2014 " + escapeHtml(String(d.description)) : ""}</div>` + playsHtml + "</div>";
  }).join("");
}
function renderPlaysTab() {
  const scoring = $("scoring-plays-list");
  const drives = $("all-plays-list");
  if (scoring) scoring.innerHTML = buildScoringCards(false);
  if (drives) drives.innerHTML = buildDriveCards();
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
    (c) => `<button class="clip-card" type="button" data-url="${escapeHtml(String(c.url || ""))}">` + (c.thumbnail ? `<img loading="lazy" src="${escapeHtml(String(c.thumbnail))}" alt="">` : "") + `<div class="chead">${escapeHtml(String(c.headline || "Highlight"))}</div></button>`
  ).join("");
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
async function renderWinProb() {
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
        <polyline points="${linePoints}" fill="none" stroke="${ink.strong}" stroke-width="1.2" stroke-linejoin="round"/>
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
async function loadStandingsView() {
  const body = $("stand-body");
  if (!body) return;
  body.innerHTML = '<div class="stand-msg">Loading\u2026</div>';
  try {
    const data = await fetchStandingsData();
    const groups = collectGroups(data).filter((grp) => grp.name.toUpperCase().includes(standActiveLeague) || grp.name.toUpperCase().includes(standActiveLeague === "AFC" ? "AMERICAN" : "NATIONAL"));
    const use = groups.length ? groups : collectGroups(data);
    if (!use.length) {
      body.innerHTML = '<div class="stand-msg">No standings available.</div>';
      return;
    }
    body.innerHTML = use.map((grp) => {
      const rows = grp.entries.map((e, i) => {
        const t = e?.team || {};
        const abbr = String(t.abbreviation || t.displayName || e?.team || "").toUpperCase().slice(0, 4);
        return `<div class="stand-row${i === 0 ? " leader" : ""}"><span class="stand-pos${i === 0 ? " first" : ""}">${i + 1}</span><span class="stand-team"><span class="stand-abbr">${escapeHtml(abbr)}</span></span><span class="stand-stat">${escapeHtml(statOf(e, ["wins", "W"]))}</span><span class="stand-stat">${escapeHtml(statOf(e, ["losses", "L"]))}</span><span class="stand-stat muted">${escapeHtml(statOf(e, ["ties", "T"]))}</span><span class="stand-pct"><span class="stand-pct-val">${escapeHtml(statOf(e, ["winPercent", "PCT"]))}</span></span></div>`;
      }).join("");
      return `<div class="stand-card"><div class="stand-card-hdr"><span class="stand-card-dot"></span><span class="stand-card-name">${escapeHtml(grp.name || "Division")}</span></div><div class="stand-col-hdr"><span>#</span><span class="stand-col-team">Team</span><span>W</span><span>L</span><span>T</span><span class="stand-col-pct">PCT</span></div>` + rows + `</div>`;
    }).join("");
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
function render(summary) {
  lastSummary = summary;
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
  const netEl = $("network-info");
  if (netEl) netEl.textContent = networksOf(g);
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
  const as = $("away-score"), hs = $("home-score");
  if (as) as.textContent = String(g.away.score);
  if (hs) hs.textContent = String(g.home.score);
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
        try {
          renderStatsTab();
        } catch (e) {
          reportError("renderStatsTab", e);
        }
      }
      if (targetTab === "plays") {
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
        void renderWinProb();
      }
      if (targetTab === "standings") {
        setStandLeague(standActiveLeague);
      }
    });
  });
}
function startPolling() {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(() => {
    if (document.hidden || eventId == null) return;
    void fetchAndRender(eventId);
  }, 1e4);
}
function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
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
      <div class="ended-headline">Thread Ended</div>
      <div class="ended-divider"></div>
      <div class="ended-text">This game thread is no longer live. Live scoreboards appear here only while a game is in progress.</div>
    </div>`;
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
  setupTabs();
  setupPlaysToggle();
  setupBoxScoreTeamTabs();
  setupWinProbDismiss();
  setupThemeToggle();
  setupExpand();
  setupGraphButton();
  setupTvButton();
  setupStandings();
  setupInlinePager();
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
