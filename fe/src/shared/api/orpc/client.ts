import { RPCLink } from '@orpc/client/fetch';
import {
  FormDtoSchema,
  PaginatedFormListSchema,
  SubmissionDtoSchema,
  type CreateFormInput,
  type FormDto,
  type PaginatedFormList,
  type SubmissionDto,
  type SubmitFormInput,
  type UpdateFormInput,
} from '@topcv/shared';
import { z } from 'zod';

import { ApiContractViolationError } from '../http/apiContractViolation';

export { ApiContractViolationError };

type OrpcProcedure<TInput, TOutput> = (input: TInput) => Promise<TOutput>;
type OrpcVoidProcedure<TOutput> = () => Promise<TOutput>;

interface TypedOrpcClient {
  forms: {
    create: OrpcProcedure<CreateFormInput, FormDto>;
    list: OrpcVoidProcedure<FormDto[]>;
    listPage: OrpcProcedure<{ page: number; pageSize: number }, PaginatedFormList>;
    get: OrpcProcedure<{ id: string }, FormDto>;
    update: OrpcProcedure<UpdateFormInput, FormDto>;
    delete: OrpcProcedure<{ id: string }, { deleted: true }>;
    search: OrpcProcedure<{ query: string }, FormDto[]>;
    active: OrpcVoidProcedure<FormDto[]>;
    submit: OrpcProcedure<SubmitFormInput, SubmissionDto>;
  };
  submissions: {
    list: OrpcVoidProcedure<SubmissionDto[]>;
  };
}

const link = new RPCLink({
  url: process.env.NEXT_PUBLIC_ORPC_URL ?? 'http://localhost:3000/rpc',
});

const clientOptions = {
  context: {},
};

const FormDtoListSchema = z.array(FormDtoSchema);
const SubmissionDtoListSchema = z.array(SubmissionDtoSchema);
const DeleteResultSchema = z.object({
  deleted: z.literal(true),
});

async function callProcedure<TInput, TOutput>(
  path: readonly string[],
  input: TInput,
  outputSchema: z.ZodType<TOutput>,
): Promise<TOutput> {
  const result = await link.call(path, input, clientOptions);

  try {
    return outputSchema.parse(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const route = path.join('/');
      throw new ApiContractViolationError({
        route,
        issues: error.issues,
        message: `API response for "${route}" did not match the shared schema: ${error.message}`,
      });
    }
    throw error;
  }
}

export const orpc: TypedOrpcClient = {
  forms: {
    create: (input) => callProcedure(['forms', 'create'], input, FormDtoSchema),
    list: () => callProcedure(['forms', 'list'], undefined, FormDtoListSchema),
    listPage: (input) => callProcedure(['forms', 'listPage'], input, PaginatedFormListSchema),
    get: (input) => callProcedure(['forms', 'get'], input, FormDtoSchema),
    update: (input) => callProcedure(['forms', 'update'], input, FormDtoSchema),
    delete: (input) => callProcedure(['forms', 'delete'], input, DeleteResultSchema),
    search: (input) => callProcedure(['forms', 'search'], input, FormDtoListSchema),
    active: () => callProcedure(['forms', 'active'], undefined, FormDtoListSchema),
    submit: (input) => callProcedure(['forms', 'submit'], input, SubmissionDtoSchema),
  },
  submissions: {
    list: () => callProcedure(['submissions', 'list'], undefined, SubmissionDtoListSchema),
  },
};
