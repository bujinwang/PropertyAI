class OAuthService {
  async oauthLogin(provider: 'google' | 'facebook', token: string) {
    const response = await fetch(`/api/auth/${provider}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });
    return response.json();
  }
}

export default new OAuthService();
