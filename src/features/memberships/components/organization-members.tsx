import { FormDialogContent } from "@/shared/components/form-dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { FilterHorizontalIcon, UserIcon } from "@hugeicons/core-free-icons";
import { EmptyState } from "@/shared/components/feedback";
import { DataToolbar } from "@/shared/components/data-toolbar";
import { RelativeTime } from "@/shared/components/relative-time";
import { StatusDot } from "@/shared/components/status-dot";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { businessStatusTone } from "@/shared/components/status";
import { DataTable, TableSkeleton } from "@/shared/components/page-patterns";
import { useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { usePrincipal } from "@/features/identity";
import { ApiError } from "@/shared/errors/api-error";
import { Button } from "@/shared/ui/button";
import {
  SettingsCard,
  SettingsSection,
} from "@/shared/components/settings-layout";
import { Badge } from "@/shared/ui/badge";
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
import { Dialog, DialogTrigger } from "@/shared/ui/dialog";
import { ValidatedForm, FormField } from "@/shared/components/form";
import { zodResolver } from "@/shared/components/form-utils";
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
const roleLabels: Record<string, string> = { OWNER: "Propriétaire" };

/** Initiales du nom quand il est connu (vous) ; sinon une silhouette, faute de nom exposé. */
function MemberAvatar({ initials }: { initials?: string }) {
  return (
    <Avatar size="sm" aria-hidden="true">
      <AvatarFallback className="bg-primary/10 text-[0.625rem] font-medium text-primary">
        {initials || (
          <HugeiconsIcon
            icon={UserIcon}
            strokeWidth={1.75}
            className="size-3.5"
          />
        )}
      </AvatarFallback>
    </Avatar>
  );
}

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
  const initials = principal.data
    ? `${principal.data.firstName.charAt(0)}${principal.data.lastName.charAt(0)}`.toUpperCase()
    : undefined;
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value && value !== "ALL") next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };
  return (
    <div className="max-w-4xl space-y-10">
      <SettingsSection
        title="Accès à l’organisation"
        description="Les noms et emails des autres membres ne sont pas encore exposés : ils sont désignés par leur identifiant utilisateur."
      >
        <DataToolbar
          search={search}
          onSearch={(value) => update("q", value)}
          searchLabel="Rechercher un identifiant"
          count={visible.length}
          countLabel="membre"
          active={
            status === "ALL"
              ? []
              : [
                  {
                    key: "status",
                    label: `Statut : ${memberStatusLabel[status as keyof typeof memberStatusLabel]}`,
                    onRemove: () => update("status", "ALL"),
                  },
                ]
          }
          filters={
            <Popover>
              <PopoverTrigger
                render={<Button variant="outline" size="sm" className="h-8" />}
              >
                <HugeiconsIcon
                  icon={FilterHorizontalIcon}
                  strokeWidth={1.75}
                  data-icon="inline-start"
                />
                Filtre
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64 space-y-1.5">
                <label
                  id="member-status-label"
                  htmlFor="member-status"
                  className="text-xs font-medium text-muted-foreground"
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
                    className="w-full"
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
              </PopoverContent>
            </Popover>
          }
          actions={
            <>
              <Button
                variant="ghost"
                size="sm"
                disabled={query.isFetching || mutation.pending}
                onClick={() => void query.refetch()}
              >
                Actualiser
              </Button>
              {capabilities.canManageMembers && (
                <AddMember
                  busy={mutation.pending}
                  add={(userId) => mutation.change({ action: "add", userId })}
                />
              )}
            </>
          }
        />
        {visible.length === 0 ? (
          <EmptyState
            objectType="members"
            variant={query.data.length === 0 ? "empty" : "filtered"}
            title={query.data.length === 0 ? "Aucun membre" : "Aucun résultat"}
            description={
              query.data.length === 0
                ? "Aucune appartenance n’a été renvoyée pour cette organisation."
                : "Modifiez vos critères de recherche."
            }
          />
        ) : (
          <DataTable>
            <TableCaption className="sr-only">
              Appartenances de {active.organizationName}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead className="hidden md:table-cell">
                  Membre depuis
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  Dernière modification
                </TableHead>
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
                    <TableCell className="min-w-48 max-w-64 whitespace-normal">
                      <div className="flex items-center gap-2.5">
                        <MemberAvatar
                          initials={
                            member.userId === principal.data?.userId
                              ? initials
                              : undefined
                          }
                        />
                        <div className="min-w-0">
                          {member.userId === principal.data?.userId && (
                            <span className="block text-sm font-medium">
                              Vous
                            </span>
                          )}
                          <span className="block font-mono text-xs break-all text-muted-foreground">
                            {member.userId}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusDot
                        label={memberStatusLabel[member.status]}
                        tone={businessStatusTone[member.status]}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {roleLabels[member.role] ?? member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      <RelativeTime value={member.createdAt} />
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                      <RelativeTime value={member.updatedAt} />
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
      </SettingsSection>
      <SettingsSection title="Invitations et rôles">
        <SettingsCard>
          <p className="p-4 text-sm text-muted-foreground">
            Les invitations par email et le changement de rôle ne sont pas
            encore disponibles. Les utilisateurs ajoutés reçoivent le rôle
            OWNER.
          </p>
        </SettingsCard>
      </SettingsSection>
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
      <FormDialogContent
        title="Ajouter un utilisateur existant"
        description="Il recevra le rôle OWNER et pourra gérer cette organisation et ses membres. Cette action n’envoie pas d’invitation."
        onClose={() => setOpen(false)}
        showCloseButton={!busy}
      >
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
          {failure !== undefined && <QueryFailure error={failure} />}
        </ValidatedForm>
      </FormDialogContent>
    </Dialog>
  );
}
