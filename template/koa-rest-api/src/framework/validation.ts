import { Context } from 'koa';
import * as yup from 'yup';

export const isObject = (
  value: unknown,
): value is Record<PropertyKey, unknown> =>
  typeof value === 'object' && value !== null;

export const isObjectWithProp = <P extends PropertyKey>(
  value: unknown,
  prop: P,
): value is Record<P, unknown> => isObject(value) && value.hasOwnProperty(prop);

const formatValidationError = (root: string, err: yup.ValidationError) => {
  const errors = err.inner.map(({ params, path, type }) => ({
    path: [root, err.path, path].filter(Boolean).join('.'),
    type: (isObject(params) && params.type) || (type as unknown),
  }));

  return JSON.stringify({ errors }, null, 2);
};

export const validate = async <T>({
  ctx,
  input,
  root,
  schema,
}: {
  ctx: Context;
  input: unknown;
  root: string;
  schema: yup.Schema<T>;
}) => {
  try {
    return await schema.validate(input, {
      abortEarly: false,
      stripUnknown: true,
    });
  } catch (err) {
    ctx.set('Content-Type', 'application/json');

    return ctx.throw(422, formatValidationError(root, err));
  }
};

export const validateRequestBody = async <T>(
  ctx: Context,
  schema: yup.Schema<T>,
): Promise<T> =>
  validate({ ctx, input: ctx.request.body as unknown, root: 'body', schema });
