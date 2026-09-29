import { EmptyState, StatusBadge } from "@/shared/components/feedback";
import { businessStatusTone } from "@/shared/components/status";
import { DataTable, TableSkeleton } from "@/shared/components/page-patterns";
import { useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { usePrincipal } from "@/features/identity";
import { ApiError } from "@/shared/errors/api-error";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/shared/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/shared/ui/alert";
import {
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
  TableCaption,
} from "@/shared/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/shared/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/shared/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/shared/ui/alert-dialog";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import {
  ValidatedForm,
  FormField,
  zodResolver,
} from "@/shared/components/form";
import { QueryFailure } from "@/shared/components/query-feedback";
import {
  useOrganizationMembers,
  useMemberChange,
} from "../queries/organization-members";
import {
  organizationCapabilities,
  memberActions,
  filterMembers,
  addMemberSchema,
  memberStatusLabel,
  type Member,
  type MemberAction,
} from "../model/member";
import type { Membership } from "../queries/current-memberships";
const actionLabels = {
  suspend: "Suspendre",
  reactivate: "Réactiver",
  revoke: "Révoquer",
};
export function OrganizationMembers({ active }: { active: Membership }) {
  const principal = usePrincipal();
  const query = useOrganizationMembers(active);
  const mutation = useMemberChange(active, principal.data?.userId);
  const [params, setParams] = useSearchParams();
  const [selection, setSelection] = useState<{
    member: Member;
    action: MemberAction;
  } | null>(null);
  const [failure, setFailure] = useState<unknown>();
  const trigger = useRef<HTMLButtonElement | null>(null);
  const capabilities = organizationCapabilities(active);
  if (!capabilities.canViewMembers)
    return <QueryFailure error={new ApiError("http", 403)} />;
  if (principal.isPending || query.isPending) return <TableSkeleton />;
  if (principal.isError)
    return (
      <QueryFailure
        error={principal.error}
        retry={() => void principal.refetch()}
      />
    );
  if (query.isError)
    return (
      <QueryFailure error={query.error} retry={() => void query.refetch()} />
    );
  const search = params.get("q") ?? "";
  const status = ["ACTIVE", "SUSPENDED", "REVOKED"].includes(
    params.get("status") ?? "",
  )
    ? params.get("status")!
    : "ALL";
  const visible = filterMembers(query.data, search, status);
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value && value !== "ALL") next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };
  return (
    <div className="space-y-4">
      <Card className="text-sm">
        <CardHeader>
          <CardTitle>
            <h2>Membres de l’organisation</h2>
          </CardTitle>
          <CardDescription>
            Les identifiants ci-dessous désignent les utilisateurs. Les noms et
            emails ne sont pas disponibles dans cette liste.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-0 basis-48 flex-1">
              <label htmlFor="member-search" className="text-sm">
                Rechercher un identifiant
              </label>
              <Input
                id="member-search"
                value={search}
                onChange={(e) => update("q", e.target.value)}
              />
            </div>
            <div>
              <label
                id="member-status-label"
                htmlFor="member-status"
                className="text-sm"
              >
                Statut
              </label>
              <Select
                value={status}
                onValueChange={(value) => update("status", value ?? "ALL")}
              >
                <SelectTrigger
                  id="member-status"
                  aria-labelledby="member-status-label"
                >
                  <SelectValue>
                    {status === "ALL"
                      ? "Tous les statuts"
                      : memberStatusLabel[
                          status as keyof typeof memberStatusLabel
                        ]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les statuts</SelectItem>
                  {Object.entries(memberStatusLabel).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              disabled={query.isFetching || mutation.pending}
              onClick={() => void query.refetch()}
            >
              Actualiser les membres
            </Button>
            {capabilities.canManageMembers && (
              <AddMember
                busy={mutation.pending}
                add={(userId) => mutation.change({ action: "add", userId })}
              />
            )}
          </div>
          <p role="status" className="text-xs text-muted-foreground">
            {visible.length} résultat(s) sur {query.data.length} membre(s).
            {query.isFetching && " Actualisation…"}
          </p>
          {visible.length === 0 ? (
            <EmptyState
              title={
                query.data.length === 0 ? "Aucun membre" : "Aucun résultat"
              }
              description={
                query.data.length === 0
                  ? "Aucune appartenance n’a été renvoyée pour cette organisation."
                  : "Modifiez vos critères de recherche."
              }
            />
          ) : (
            <DataTable>
              <TableCaption>
                Appartenances de {active.organizationName}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead className="hidden md:table-cell">Depuis</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((member) => {
                  const actions = memberActions(active, member, query.data);
                  const protectedOwner =
                    member.status !== "REVOKED" &&
                    !actions.revoke &&
                    capabilities.canManageMembers;
                  return (
                    <TableRow key={member.id}>
                      <TableCell className="min-w-36 max-w-48 whitespace-normal">
                        <span className="break-all text-xs">
                          {member.userId}
                        </span>
                        {member.userId === principal.data?.userId && (
                          <span className="block text-xs text-muted-foreground">
                            Vous
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={memberStatusLabel[member.status]}
                          tone={businessStatusTone[member.status]}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{member.role}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {new Date(member.createdAt).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell>
                        {capabilities.canManageMembers ? (
                          <>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={mutation.pending}
                                    aria-label={"Actions pour " + member.userId}
                                  />
                                }
                                onClick={(e) => {
                                  trigger.current = e.currentTarget;
                                }}
                              >
                                Actions
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {(
                                  ["suspend", "reactivate", "revoke"] as const
                                ).map((action) => (
                                  <DropdownMenuItem
                                    key={action}
                                    disabled={!actions[action]}
                                    variant={
                                      action === "revoke"
                                        ? "destructive"
                                        : "default"
                                    }
                                    onClick={() => {
                                      setFailure(undefined);
                                      setSelection({ member, action });
                                    }}
                                  >
                                    {actionLabels[action]}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                            {protectedOwner && (
                              <p className="mt-1 max-w-32 whitespace-normal text-xs text-muted-foreground">
                                Au moins un OWNER actif doit rester.
                              </p>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Lecture seule
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </DataTable>
          )}
        </CardContent>
      </Card>
      <Alert>
        <AlertTitle>Invitations et rôles</AlertTitle>
        <AlertDescription>
          Les invitations par email et le changement de rôle ne sont pas encore
          disponibles. Les utilisateurs ajoutés reçoivent le rôle OWNER.
        </AlertDescription>
      </Alert>
      <AlertDialog
        open={!!selection}
        onOpenChange={(open) => {
          if (!open && !mutation.pending) setSelection(null);
        }}
      >
        <AlertDialogContent finalFocus={trigger}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selection
                ? actionLabels[selection.action] + " ce membre ?"
                : "Modifier l’appartenance"}
            </AlertDialogTitle>
            <AlertDialogDescription className="break-words">
              Utilisateur :{" "}
              <span className="break-all">{selection?.member.userId}</span>.{" "}
              {selection?.action === "revoke"
                ? "Son accès sera retiré définitivement pour cette appartenance."
                : selection?.action === "suspend"
                  ? "Son accès sera interrompu jusqu’à une réactivation."
                  : "Son accès sera rétabli."}{" "}
              {selection?.member.userId === principal.data?.userId &&
                "Vous modifiez votre propre accès."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {failure !== undefined && <QueryFailure error={failure} />}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.pending}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={
                mutation.pending ||
                !selection ||
                !memberActions(active, selection.member, query.data)[
                  selection.action
                ]
              }
              variant={
                selection?.action === "revoke" ? "destructive" : "default"
              }
              onClick={() => {
                if (!selection) return;
                setFailure(undefined);
                void mutation
                  .change({
                    action: selection.action,
                    userId: selection.member.userId,
                  })
                  .then((ok) => {
                    if (ok) setSelection(null);
                  })
                  .catch(setFailure);
              }}
            >
              {mutation.pending ? "En cours…" : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
function AddMember({
  busy,
  add,
}: {
  busy: boolean;
  add: (userId: string) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [failure, setFailure] = useState<unknown>();
  const form = useForm<{ userId: string }>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: { userId: "" },
  });
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!busy) {
          setOpen(value);
          setFailure(undefined);
          if (value) form.reset();
        }
      }}
    >
      <DialogTrigger render={<Button disabled={busy} />}>
        Ajouter un utilisateur
      </DialogTrigger>
      <DialogContent showCloseButton={!busy}>
        <DialogHeader>
          <DialogTitle>Ajouter un utilisateur existant</DialogTitle>
          <DialogDescription>
            Il recevra le rôle OWNER et pourra gérer cette organisation et ses
            membres. Cette action n’envoie pas d’invitation.
          </DialogDescription>
        </DialogHeader>
        <ValidatedForm
          form={form}
          disabled={busy}
          submitLabel="Ajouter comme OWNER"
          onSubmit={async ({ userId }) => {
            setFailure(undefined);
            try {
              if (await add(userId)) setOpen(false);
            } catch (error) {
              setFailure(error);
            }
          }}
        >
          <FormField
            name="userId"
            label="Identifiant utilisateur"
            description="UUID d’un compte existant."
            autoComplete="off"
          />
        </ValidatedForm>
        {failure !== undefined && <QueryFailure error={failure} />}
      </DialogContent>
    </Dialog>
  );
}
