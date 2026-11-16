### 🔑 Verified Accounts with Application Access

| Full Name | Role | Home Hub | Identifier (Email or Phone) | Password | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Animateur Principal LRC** | `AP` *(Global Admin)* | Douala (`DLA`) | `ap.overseer@lrcjrs.org`<br>`+237670000001` | `ChangeMe123!` | Must Change Password |
| **Assistant Animateur Principal** | `AP` *(Global Admin)* | Douala (`DLA`) | `ap.assistant@lrcjrs.org`<br>`+237670000002` | `ChangeMe123!` | Must Change Password |
| **Ngangman Teddy** | `PC` *(Coordinator)* | Douala (`DLA`)* | `teddy.webdev@gmail.com`<br>`+237693087159` | `ChangeMe123!` | Must Change Password |
| **PC Douala 1 (Jean Dupont)** | `PC` *(Coordinator)* | Douala (`DLA`) | `pc.douala1@lrcjrs.org`<br>`+237671110001` | `ChangeMe123!` | Must Change Password |
| **PC Douala 2 (Marie Claire)** | `PC` *(Coordinator)* | Douala (`DLA`) | `pc.douala2@lrcjrs.org`<br>`+237671110002` | `ChangeMe123!` | Must Change Password |
| **Member Douala 1** | `MEMBER` | Bafoussam (`BAF`) | `member.dla1@lrcjrs.org`<br>`+237672220001` | `ChangeMe123!` | Must Change Password |
| **Member Douala 2** | `MEMBER` | Edéa (`EDA`) | `member.dla2@lrcjrs.org`<br>`+237672220002` | `ChangeMe123!` | Must Change Password |

*\*Note: PC Ngangman Teddy has authorized read permissions across all 4 town hubs (`DLA`, `YDE`, `EDA`, `BAF`).*  
*(The remaining 100 members in the database are community directory members with `hasAppAccess: false` awaiting activation).*

---

### 🚀 How to Authenticate

The server supports **Universal Login** (`POST /api/auth/login`), accepting either the **Email** or the **Phone number** in the `identifier` field:

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "identifier": "teddy.webdev@gmail.com",
  "password": "ChangeMe123!"
}
```
*(Or with phone number: `"identifier": "+237693087159"` or `"237693087159"`)*.

#### Login Flow Note:
Because these seeded accounts are configured with `isTemporaryPassword: true`, the initial login returns a temporary `setupToken` prompting to create a permanent password:
```json
{
  "requiresPasswordChange": true,
  "setupToken": "eyJhbGciOi...",
  "message": "Temporary password verified. Please create your permanent password."
}
```
To set a permanent password, submit `POST /api/auth/complete-setup` with the `setupToken` and your new permanent password. Once completed, standard JWT `accessToken` and `refreshToken` will be issued on subsequent logins without password change prompts.