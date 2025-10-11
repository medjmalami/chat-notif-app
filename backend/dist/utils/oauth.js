export async function getGoogleOAuthTokens(code) {
    const url = 'https://oauth2.googleapis.com/token';
    const params = {
        code,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        redirect_uri: `${process.env.FRONTEND_URL}/auth/callback`,
        grant_type: 'authorization_code',
    };
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(params),
    });
    return response.json();
}
export async function getGoogleUser(access_token) {
    const response = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${access_token}`);
    return response.json();
}
