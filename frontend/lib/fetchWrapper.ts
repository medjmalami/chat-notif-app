import { refreshToken } from "./refreshToken";

export const fetchWrapper = async (url: string, method: string, body?: any) => {
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

  if (response.status === 401) {
    const didRefresh = await refreshToken();
    if (didRefresh) {
      const secondResponse = await makeRequest();
      return secondResponse;
    }
  }

  return response;
};