import type { SupabaseClient } from "@supabase/supabase-js";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function loginTestUser(supabase: SupabaseClient): string {
  supabase.auth.signInWithPassword({
    email: 'test@test.test',
    password: 'qwerqwer'
  });

  return '1a087592-a205-4753-aa3f-755721bd4f1a';

}