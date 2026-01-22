import { projectId, publicAnonKey } from "/utils/supabase/info";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  accessToken: string;
}

// Sign up a new admin user
export async function signUp(email: string, password: string, name: string): Promise<AuthUser> {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-0dda4881/auth/signup`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email, password, name }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to sign up");
    }

    return {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || name,
      accessToken: data.access_token,
    };
  } catch (error) {
    console.error("Sign up error:", error);
    throw error;
  }
}

// Sign in an existing admin user
export async function signIn(email: string, password: string): Promise<AuthUser> {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-0dda4881/auth/signin`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email, password }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to sign in");
    }

    return {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || email,
      accessToken: data.access_token,
    };
  } catch (error) {
    console.error("Sign in error:", error);
    throw error;
  }
}

// Check if user has an active session
export async function getSession(): Promise<AuthUser | null> {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-0dda4881/auth/session`,
      {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok || !data.user) {
      return null;
    }

    return {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || data.user.email,
      accessToken: data.access_token,
    };
  } catch (error) {
    console.error("Get session error:", error);
    return null;
  }
}

// Sign out the current user
export async function signOut(): Promise<void> {
  try {
    await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-0dda4881/auth/signout`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      }
    );
  } catch (error) {
    console.error("Sign out error:", error);
  }
}
