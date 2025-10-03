"use client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CallbackPage({ searchParams }: { searchParams: { code?: string; state?: string; error?: string } }) {
  const { toast } = useToast();
  const router = useRouter();
  const code = searchParams.code;
  const error = searchParams.error;

  useEffect(() => {
    if (error) {
      toast({
        title: "OAuth Error",
        description: error,
        variant: "destructive",
      });
      return;
    }

    if (code) {
      (async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/callback`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
            credentials: "include", // include cookies
          });

          if (response.status !== 200) {
            toast({
              title: "Error",
              description: "Something went wrong",
              variant: "destructive",
            });
          } else {
            router.push("/"); // redirect on success
          }
        } catch (err) {
          console.error("🔴 Fetch error:", err);
          toast({
            title: "Error",
            description: "Request failed",
            variant: "destructive",
          });
        }
      })();
    }
  }, [code, error, toast, router]);

  return <p>Handling Google OAuth callback...</p>;
}
