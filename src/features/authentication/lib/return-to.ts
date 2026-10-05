const fallback = "/organizations/select";
// Only existing placeholders are accepted. Membership authorization is not inferred.
export function safeAuthDestination(value: unknown): string {
  if (typeof value !== "string" || /[%\\\s?#]/.test(value)) return fallback;
  if (
    [
      "/onboarding",
      "/onboarding/organization",
      "/app",
      fallback,
      "/account",
      "/organizations/select",
      "/onboarding/status",
      "/platform-admin",
    ].includes(value)
  )
    return value;
  if (
    /^\/app\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\/organization|\/settings(?:\/(?:general|members))?)?$/i.test(
      value,
    )
  )
    return value;
  // La console plateforme est un point d'entree authorize par le backend.
  if (/^\/platform-admin(\/organizations|\/reseau|\/audit)?$/.test(value))
    return value;
  return fallback;
}
