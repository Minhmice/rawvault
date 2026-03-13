import { z } from "zod";

const emailSchema = z.string().trim().email().max(320);
const passwordSchema = z.string().min(8).max(72);

export const authCredentialsSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const authSignUpRequestSchema = authCredentialsSchema;
export const authSignInRequestSchema = authCredentialsSchema;

export const authUserSchema = z.object({
  id: z.string().uuid(),
  email: emailSchema.nullable(),
});

export const authSessionSchema = z.object({
  userId: z.string().uuid(),
  expiresAt: z.string().datetime().nullable(),
});

export const signUpResponseSchema = z.object({
  success: z.literal(true),
  user: authUserSchema.nullable(),
  session: authSessionSchema.nullable(),
  emailConfirmationRequired: z.boolean(),
});

export const signInResponseSchema = z.object({
  success: z.literal(true),
  user: authUserSchema,
  session: authSessionSchema,
});

export const signOutResponseSchema = z.object({
  success: z.literal(true),
  signedOut: z.literal(true),
});

export const currentSessionResponseSchema = z.object({
  success: z.literal(true),
  session: authSessionSchema.nullable(),
  user: authUserSchema.nullable(),
});

export const currentUserResponseSchema = z.object({
  success: z.literal(true),
  user: authUserSchema.nullable(),
});

export const authSignUpResponseSchema = signUpResponseSchema;
export const authSignInResponseSchema = signInResponseSchema;
export const authSignOutResponseSchema = signOutResponseSchema;
export const authCurrentSessionResponseSchema = currentSessionResponseSchema;
export const authCurrentUserResponseSchema = currentUserResponseSchema;

export type AuthCredentials = z.infer<typeof authCredentialsSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthSession = z.infer<typeof authSessionSchema>;
export type SignUpResponse = z.infer<typeof signUpResponseSchema>;
export type SignInResponse = z.infer<typeof signInResponseSchema>;
export type SignOutResponse = z.infer<typeof signOutResponseSchema>;
export type CurrentSessionResponse = z.infer<typeof currentSessionResponseSchema>;
export type CurrentUserResponse = z.infer<typeof currentUserResponseSchema>;

export type AuthSignUpRequest = AuthCredentials;
export type AuthSignInRequest = AuthCredentials;
export type AuthSignUpResponse = SignUpResponse;
export type AuthSignInResponse = SignInResponse;
export type AuthSignOutResponse = SignOutResponse;
export type AuthCurrentSessionResponse = CurrentSessionResponse;
export type AuthCurrentUserResponse = CurrentUserResponse;
