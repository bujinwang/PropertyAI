# Security Policy

## Supported Versions

We actively support the following versions of PropertyAI with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of PropertyAI seriously. If you discover a security vulnerability, please follow these steps:

### 🔒 Private Disclosure

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report security vulnerabilities to us privately:

1. **Email**: Send details to `security@propertyai.com`
2. **Subject**: Include "SECURITY" in the subject line
3. **Details**: Include as much information as possible about the vulnerability

### 📋 What to Include

When reporting a vulnerability, please include:

- **Description**: A clear description of the vulnerability
- **Impact**: What an attacker could potentially do
- **Reproduction**: Step-by-step instructions to reproduce the issue
- **Affected Components**: Which parts of the system are affected
- **Suggested Fix**: If you have ideas for how to fix it (optional)
- **Proof of Concept**: Code or screenshots demonstrating the issue (if safe to share)

### ⏱️ Response Timeline

We will acknowledge receipt of your vulnerability report within **48 hours** and provide a detailed response within **7 days** indicating:

- Confirmation of the vulnerability
- Our assessment of the issue's severity
- Estimated timeline for a fix
- Any additional information we need

### 🛡️ Security Measures

PropertyAI implements several security measures:

#### Authentication & Authorization
- JWT tokens with automatic refresh
- Role-based access control (RBAC)
- Multi-factor authentication (MFA) support
- Session management with secure storage

#### Data Protection
- Encryption at rest for sensitive data
- TLS/HTTPS encryption in transit
- Input validation and sanitization
- SQL injection prevention with parameterized queries
- XSS protection with content security policies

#### Infrastructure Security
- Regular dependency updates and vulnerability scanning
- Container security scanning
- Environment variable protection
- Rate limiting and DDoS protection
- Secure default configurations

#### API Security
- Input validation on all endpoints
- Request size limits
- CORS configuration
- API rate limiting
- Authentication required for sensitive operations

### 🚨 Security Best Practices for Contributors

When contributing to PropertyAI, please follow these security guidelines:

#### Code Review
- All code changes require review before merging
- Security-focused review for authentication/authorization changes
- Automated security scanning in CI/CD pipeline

#### Dependencies
- Keep dependencies updated
- Use `npm audit` to check for vulnerabilities
- Avoid dependencies with known security issues

#### Secrets Management
- Never commit secrets, API keys, or passwords
- Use environment variables for sensitive configuration
- Use `.env.example` files for documentation

#### Input Validation
- Validate all user inputs
- Use parameterized queries for database operations
- Sanitize data before displaying to users
- Implement proper error handling

### 🔍 Vulnerability Assessment

We regularly perform:

- **Dependency Scanning**: Automated scanning of npm packages
- **Code Analysis**: Static analysis of source code
- **Penetration Testing**: Regular security assessments
- **Security Audits**: Third-party security reviews

### 📊 Disclosure Timeline

Our typical vulnerability disclosure timeline:

1. **Day 0**: Vulnerability reported
2. **Day 1-2**: Initial response and confirmation
3. **Day 3-7**: Detailed assessment and impact analysis
4. **Day 7-30**: Fix development and testing
5. **Day 30-45**: Release with security fix
6. **Day 45+**: Public disclosure (coordinated with reporter)

### 🏆 Security Hall of Fame

We recognize security researchers who help make PropertyAI more secure:

<!-- This section will be updated as we receive valid security reports -->

*Be the first to help us improve PropertyAI's security!*

### 📞 Contact Information

- **Security Email**: security@propertyai.com
- **General Contact**: team@propertyai.com
- **GitHub Issues**: For non-security bugs only

### 💡 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Guidelines](https://nodejs.org/en/docs/guides/security/)
- [React Security Best Practices](https://blog.logrocket.com/security-considerations-react-applications/)

---

**Thank you for helping keep PropertyAI and our users safe!** 🔒