export const dynamic = "force-dynamic";

import { Suspense } from "react";
import SignInClient from "@/app/(guest)/sign-in/sign-in-client";

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInClient />
    </Suspense>
  );
}
