# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
    - img [ref=e8]
  - alert [ref=e11]
  - generic [ref=e13]:
    - generic [ref=e14]:
      - generic [ref=e15]: B
      - heading "Sign in to your account" [level=2] [ref=e16]
      - paragraph [ref=e17]:
        - text: Or
        - link "create a new account" [ref=e18] [cursor=pointer]:
          - /url: /auth/register
    - generic [ref=e19]:
      - generic [ref=e20]:
        - heading "Sign In" [level=3] [ref=e21]
        - paragraph [ref=e22]: Enter your credentials to access your account
      - generic [ref=e24]:
        - generic [ref=e25]: Invalid credentials
        - generic [ref=e26]:
          - text: Email address
          - textbox "Email address" [ref=e27]: john@example.com
        - generic [ref=e28]:
          - text: Password
          - textbox "Password" [ref=e29]: SecurePassword123!
        - generic [ref=e31]:
          - checkbox "Use passwordless login" [ref=e32]
          - text: Use passwordless login
        - button "Sign in" [ref=e34]
```