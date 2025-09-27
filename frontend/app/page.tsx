import { redirect } from "next/navigation"
import { fetchWrapper } from "../lib/fetchWrapper";

export default async function Home() {
    const res = await fetchWrapper('/auth', 'GET');

    if (res.status === 200) {
        redirect('/chat');
    }
    redirect('auth/login');
}
