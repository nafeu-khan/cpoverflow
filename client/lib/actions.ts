// lib/actions.ts - Django Backend Integration

// Token management functions
export async function getAccessToken(): Promise<string|null> {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken');
  }
  return null;
}

export async function getRefreshToken(): Promise<string|null> {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refreshToken');
  }
  return null;
}

export async function setTokens(access: string, refresh: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
  }
}

export async function clearTokens() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}

// User management functions for Django backend
export async function getCurrentUser() {
  // This will be handled by AuthContext
  return null;
}

// Placeholder for future Django API integration
export async function createQuestion(data: any) {
  // TODO: Implement with Django API
  console.log('Create question:', data);
}

export async function getQuestions(params: any) {
  // TODO: Implement with Django API
  console.log('Get questions:', params);
  return { questions: [], isNext: false };
}

export async function getTags() {
  // TODO: Implement with Django API
  return [];
}

export async function getUsers() {
  // TODO: Implement with Django API
  return [];
}
  