import * as Keychain from 'react-native-keychain';

class AuthService {
  async login(email: string, password: string) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (response.ok) {
      await Keychain.setGenericPassword(email, data.token);
    }
    return data;
  }

  async register(email: string, password: string) {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  }

  async logout() {
    await Keychain.resetGenericPassword();
  }

  async getToken() {
    const credentials = await Keychain.getGenericPassword();
    return credentials ? credentials.password : null;
  }
}

export default new AuthService();
