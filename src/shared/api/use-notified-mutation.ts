import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { toUserMessage } from "@/shared/errors/api-error";
import { notify } from "@/shared/components/notifications";

type Message<TData, TVariables> =
  | string
  | { title: string; description?: string }
  | ((
      data: TData,
      variables: TVariables,
    ) => string | { title: string; description?: string });

/**
 * Mutation avec la discipline de retour commune :
 * - succès : toast nommant l'objet (`success`), puis invalidation des clés données ;
 * - échec : l'erreur reste dans le contexte de l'action (dialogue, formulaire) via `error` ;
 *   `errorToast` ne sert qu'aux actions sans contexte visible (action de ligne).
 * Pas de nouvel essai automatique : un envoi ne doit jamais être rejoué en silence.
 */
export function useNotifiedMutation<TData, TVariables = void>({
  success,
  invalidate = [],
  errorToast,
  ...options
}: UseMutationOptions<TData, unknown, TVariables> & {
  success: Message<TData, TVariables>;
  invalidate?: QueryKey[];
  /** Titre du toast d'erreur, pour une action sans emplacement d'erreur visible. */
  errorToast?: string;
}) {
  const client = useQueryClient();
  return useMutation<TData, unknown, TVariables>({
    retry: false,
    ...options,
    onSuccess: async (data, variables, result, context) => {
      const message =
        typeof success === "function" ? success(data, variables) : success;
      const { title, description } =
        typeof message === "string"
          ? { title: message, description: undefined }
          : message;
      notify.success(title, description);
      await Promise.all(
        invalidate.map((queryKey) => client.invalidateQueries({ queryKey })),
      );
      await options.onSuccess?.(data, variables, result, context);
    },
    onError: (error, variables, result, context) => {
      if (errorToast) notify.error(errorToast, toUserMessage(error));
      options.onError?.(error, variables, result, context);
    },
  });
}
