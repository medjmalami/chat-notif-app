export const refreshToken = async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/refreshToken`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    });
    if (response.status === 200) {
        return true ;
    }
    return false;
};