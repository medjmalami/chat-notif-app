import { refreshToken } from "./refreshToken";

export const fetchWrapper = async (url: string, method: string, body?: any) => {
  const isServer = typeof window === 'undefined';
  
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
    
    if (shouldIncludeBody) {
      options.body = JSON.stringify(body);
    }
    
    return fetch(process.env.NEXT_PUBLIC_API_BASE_URL + url, options);
  };
  
  const response = await makeRequest();
  
  if (response.status === 401 && !isServer) {
    const didRefresh = await refreshToken();
    
    if (didRefresh) {
      const secondResponse = await makeRequest();
      return secondResponse;
    }
  } else if (response.status === 401 && isServer) {
    console.log('⚠️ Got 401 on SERVER, skipping refresh');
  }
  
  return response;
};