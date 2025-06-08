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

  async getMfaSetupUri() {
    const token = await this.getToken();
    const response = await fetch('/api/mfa/enable', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  }

  async getMfaSecret() {
    const token = await this.getToken();
    const response = await fetch('/api/mfa/manual-secret', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  }

  async verifyMfa(code: string) {
    const token = await this.getToken();
    const response = await fetch('/api/mfa/verify-setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ code }),
    });
    return response.json();
  }

  async verifyMfaLogin(code: string) {
    const token = await this.getToken();
    const response = await fetch('/api/auth/mfa/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ code }),
    });
    return response.json();
  }

  async resendMfaCode() {
    const token = await this.getToken();
    const response = await fetch('/api/auth/mfa/resend-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  }
}

export default new AuthService();
