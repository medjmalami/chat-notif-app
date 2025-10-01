import { refreshToken } from "./refreshToken";

export const fetchWrapper = async (url: string, method: string, body?: any) => {
  const isServer = typeof window === 'undefined';
  console.log('🔵 fetchWrapper called for:', url, 'isServer:', isServer);
  
  // Methods that typically don't have a body
  const methodsWithoutBody = ['GET', 'DELETE'];
  const shouldIncludeBody = !methodsWithoutBody.includes(method.toUpperCase()) && body !== undefined;
  
  const makeRequest = async () => {
    const options: RequestInit = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    };
    
    // Only add body if the method supports it and body is provided
    if (shouldIncludeBody) {
      options.body = JSON.stringify(body);
    }
    
    return fetch(process.env.NEXT_PUBLIC_API_BASE_URL + url, options);
  };
  
  const response = await makeRequest();
  console.log('📥 Response status:', response.status, 'for', url);
  
  // ONLY refresh on client-side
  if (response.status === 401 && !isServer) {
    console.log('🔄 Got 401 on CLIENT, attempting refresh...');
    const didRefresh = await refreshToken();
    console.log('✅ Refresh result:', didRefresh);
    
    if (didRefresh) {
      console.log('🔁 Retrying original request...');
      const secondResponse = await makeRequest();
      console.log('📥 Second response status:', secondResponse.status);
      return secondResponse;
    }
  } else if (response.status === 401 && isServer) {
    console.log('⚠️ Got 401 on SERVER, skipping refresh');
  }
  
  return response;
};