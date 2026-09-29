import { memberHandlers } from "./member-handlers";
import { webAuthHandlers } from "./web-auth-handlers";
import { onboardingHandlers } from "./onboarding-handlers";
import { authHandlers } from "./auth-handlers";
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";
export const worker = setupWorker(
  ...handlers,
  ...webAuthHandlers,
  ...authHandlers,
  ...onboardingHandlers,
  ...memberHandlers,
);
