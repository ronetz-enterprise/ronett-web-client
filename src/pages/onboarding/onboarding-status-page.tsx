import { Link, Navigate } from "react-router";
import { CreationResult, useCreationAttempt } from "@/features/onboarding";
import { organizationRoutes } from "@/shared/auth/organization-routes";
export default function OnboardingStatusPage() {
  const attempt = useCreationAttempt();

  if (
    attempt.status !== "created" &&
    attempt.status !== "unknown" &&
    attempt.status !== "creating"
  )
    return <Navigate replace to={organizationRoutes.create} />;
  return (
    <>
      <CreationResult />
      <Link className="underline" to={organizationRoutes.select}>
        Mes organisations
      </Link>
      <Link className="block underline" to="/account">
        Mon compte
      </Link>
    </>
  );
}
