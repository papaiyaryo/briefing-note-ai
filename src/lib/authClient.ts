import { WorkspaceClient } from "./workspace/client";
export const authClient = new WorkspaceClient();
export const getSession = () =>
  authClient.get<{ userId: string }>("/api/v1/auth/session");
export const login = (email: string, password: string) =>
  authClient.send<{ userId: string }>(
    authClient.prepare("/api/v1/auth/login", "POST", { email, password }),
  );
export const logout = () =>
  authClient.send(authClient.prepare("/api/v1/auth/logout", "POST", {}));
