import { Link, Navigate } from "react-router";
import {
  CreateOrganizationForm,
  OnboardingSteps,
  useCreationAttempt,
} from "@/features/onboarding";
import { SessionMenu } from "@/features/authentication";
import { PageHeader } from "@/shared/components/feedback";
import { organizationRoutes } from "@/shared/auth/organization-routes";
export default function CreateOrganizationPage() {
  const attempt = useCreationAttempt();
  if (attempt.status === "created" || attempt.status === "unknown")
    return <Navigate replace to={organizationRoutes.creationStatus} />;
  return (
    <>
      <OnboardingSteps current={1} />
      <PageHeader
        title="Créer une organisation"
        description="Donnez un nom à votre organisation et choisissez sa devise : elle servira aux prix de vos offres."
      />
      <CreateOrganizationForm />
      <Link
        className="inline-block text-sm underline underline-offset-4"
        to={organizationRoutes.select}
      >
        Mes organisations
      </Link>
      <SessionMenu />
    </>
  );
}
