import { memberHandlers } from "./member-handlers";
import { webAuthHandlers } from "./web-auth-handlers";
import { onboardingHandlers } from "./onboarding-handlers";
import { authHandlers } from "./auth-handlers";
import { setupServer } from "msw/node";
import { handlers } from "./handlers";
export const server = setupServer(
  ...handlers,
  ...webAuthHandlers,
  ...authHandlers,
  ...onboardingHandlers,
  ...memberHandlers,
);
