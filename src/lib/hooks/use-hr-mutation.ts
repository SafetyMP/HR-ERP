"use client";

import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { hrApiFetch } from "@/lib/auth/hr-api-fetch";
import { useHrAccess } from "@/lib/auth/use-hr-access";

type MutationFn<TBody, TResult> = (
  bearerToken: string | null,
  body: TBody,
) => Promise<TResult>;

export function useHrMutation<TBody, TResult>(
  options: {
    mutationFn: MutationFn<TBody, TResult>;
    invalidateKeys?: QueryKey[];
    successMessage?: string;
  } & Omit<UseMutationOptions<TResult, Error, TBody>, "mutationFn">,
) {
  const { bearerToken } = useHrAccess();
  const queryClient = useQueryClient();
  const { mutationFn, invalidateKeys, successMessage, onSuccess, onError, ...rest } =
    options;

  return useMutation({
    ...rest,
    mutationFn: (body) => mutationFn(bearerToken, body),
    onSuccess: (data, variables, onMutateResult, context) => {
      if (successMessage) toast.success(successMessage);
      if (invalidateKeys?.length) {
        void Promise.all(
          invalidateKeys.map((key) => queryClient.invalidateQueries({ queryKey: key })),
        );
      }
      onSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      toast.error(error.message || "Something went wrong");
      onError?.(error, variables, onMutateResult, context);
    },
  });
}
