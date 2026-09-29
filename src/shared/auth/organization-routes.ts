import { z } from "zod";
export const organizationRoutes = {
  create: "/onboarding/organization",
  creationStatus: "/onboarding/status",
  select: "/organizations/select",
  dashboard: (id: string) => "/app/" + z.uuid().parse(id),
  settings: (id: string) => "/app/" + z.uuid().parse(id) + "/settings/general",
  members: (id: string) => "/app/" + z.uuid().parse(id) + "/settings/members",
  overview: (id: string) => "/app/" + z.uuid().parse(id) + "/organization",
};
