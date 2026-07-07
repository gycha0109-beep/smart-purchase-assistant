export const getSession = () => JSON.parse(localStorage.getItem('auth_session') || 'null');

export const login = (email, password) => {
  if (email === 'admin@store.com' && password === 'admin123') {
    const session = { email, role: 'admin', name: '매장 관리자' };
    localStorage.setItem('auth_session', JSON.stringify(session));
    return { success: true, session };
  }

  return { success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
};

export const logout = () => {
  localStorage.removeItem('auth_session');
};
