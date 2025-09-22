import { redirect } from "next/navigation"

export default function HomePage() {
  // Redirect to login page as the default entry point
  redirect("/auth/login")
}
