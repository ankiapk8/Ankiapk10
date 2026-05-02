import * as zod from "zod";

export const ExchangeMobileAuthorizationCodeBody = zod.object({
  code: zod.string(),
  redirectUri: zod.string(),
});

export const ExchangeMobileAuthorizationCodeResponse = zod.object({
  token: zod.string(),
});

export const LogoutMobileSessionResponse = zod.object({
  success: zod.boolean(),
});
