// Development/test-only server simulation. Never imported into production bundles.
export const orgA = "00000000-0000-4000-8000-000000000001";
export const orgB = "00000000-0000-4000-8000-000000000002";
export function membership(id = orgA, name = "Organisation A") {
  return {
    membershipId: id,
    organizationId: id,
    organizationName: name,
    organizationStatus: "ACTIVE",
    role: "OWNER",
    membershipStatus: "ACTIVE",
    permissions: [
      "ORGANIZATION_READ",
      "ORGANIZATION_UPDATE",
      "MEMBERSHIP_READ",
      "MEMBERSHIP_MANAGE",
    ],
  };
}
type RecordData = {
  items: ReturnType<typeof membership>[];
  operations: Record<string, { name: string; currency: string; id: string }>;
};
const records = new Map<string, RecordData>();
export function fixtureRecord(email: string): RecordData {
  if (!records.has(email)) {
    let stored: RecordData | undefined;
    if (typeof sessionStorage !== "undefined") {
      try {
        const raw = sessionStorage.getItem("msw-server." + email);
        if (raw) stored = JSON.parse(raw) as RecordData;
      } catch {
        /* fixture */
      }
    }
    records.set(
      email,
      stored ?? {
        items:
          email.startsWith("zero") ||
          email.startsWith("next") ||
          email.startsWith("new")
            ? []
            : email.startsWith("multi")
              ? [membership(), membership(orgB, "Organisation B")]
              : [membership()],
        operations: {},
      },
    );
  }
  return records.get(email)!;
}
export function saveFixture(email: string) {
  if (typeof sessionStorage !== "undefined")
    sessionStorage.setItem(
      "msw-server." + email,
      JSON.stringify(records.get(email)),
    );
}
export function resetTenantFixtures() {
  records.clear();
}
export function fixtureEmail(request: Request) {
  const bearer = request.headers.get("Authorization");
  if (!bearer?.startsWith("Bearer fixture-access-")) return undefined;
  return bearer.slice("Bearer fixture-access-".length).split("|")[0];
}
