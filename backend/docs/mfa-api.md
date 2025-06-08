d# MFA API

## Enable MFA

**Endpoint:** `POST /mfa/enable`

**Description:** Enables MFA for the authenticated user.

**Security:** Bearer Authentication

**Responses:**

- `200 OK`: MFA enabled successfully.
  - **Body:**
    ```json
    {
      "secret": "...",
      "qrCode": "...",
      "backupCodes": ["...", "..."]
    }
    ```

## Disable MFA

**Endpoint:** `POST /mfa/disable`

**Description:** Disables MFA for the authenticated user.

**Security:** Bearer Authentication

**Responses:**

- `204 No Content`: MFA disabled successfully.
