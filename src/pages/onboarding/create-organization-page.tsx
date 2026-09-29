import { Link, Navigate } from "react-router";
import {
  CreateOrganizationForm,
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
      <PageHeader title="Créer une organisation" />
      <p>Donnez un nom à votre organisation et choisissez sa devise.</p>
      <CreateOrganizationForm />
      <Link className="underline" to={organizationRoutes.select}>
        Mes organisations
      </Link>
      <SessionMenu />
    </>
  );
}
