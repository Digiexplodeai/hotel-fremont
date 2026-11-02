import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, signOutAction } from "@/actions/auth";
import { getR2ConfigSummary } from "@/lib/r2";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  const r2Summary = getR2ConfigSummary();

  return NextResponse.json({
    authenticated: Boolean(user),
    user: user
      ? {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
        }
      : null,
    r2Config: {
      isConfigured: r2Summary.isConfigured,
      bucketName: r2Summary.bucketName,
      publicUrl: r2Summary.publicUrl,
    },
  });
}

export async function DELETE() {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    await supabase.auth.signOut();
  }

  return NextResponse.json({
    success: true,
    message: "Admin session logged out successfully.",
  });
}
