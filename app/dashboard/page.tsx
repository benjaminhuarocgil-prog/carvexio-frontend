"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { getRole, getToken } from "../../lib/session";

export default function DashboardRouterPage() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    const role = getRole();
    if (role === "ADMIN") {
      router.replace("/admin/negocios");
      return;
    }
    if (role === "EMPRESA") {
      router.replace("/empresa/dashboard");
      return;
    }
    if (role === "CLIENTE") {
      router.replace("/cliente/dashboard");
      return;
    }

    router.replace("/");
  }, [router]);

  return null;
}
