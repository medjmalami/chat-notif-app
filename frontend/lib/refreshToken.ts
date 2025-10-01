export const refreshToken = async () => {
    console.log('🔄 refreshToken called');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/refreshToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    console.log('🔄 Refresh response status:', response.status);
    
    if (response.status === 200) {
      return true;
    }
    
    return false;
  };