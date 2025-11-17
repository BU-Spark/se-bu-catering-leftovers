# CI Workflows

This project uses **GitHub Actions** for continuous integration.

## Workflows Included

- **Mobile Lint**  
  Runs ESLint in the `mobile/` app directory to enforce code quality and catch errors early.

- **Backend RBAC E2E**  
  Runs Jest end-to-end tests in `backend/` to verify secure role-based access control.

## How They Run

| Workflow | Trigger |
|---------|---------|
| Mobile Lint | Push to `main` / `dev` + all pull requests |
| Backend RBAC E2E | Push to `main` / `dev` or manual trigger |

## Challenges

- Ensuring proper working directories for monorepo structure (Fixed using `defaults.run.working-directory`)
- Performance during installs (Fixed by caching Node dependency installs)

## In the Future

As we add more testing suites, we will expand our CI pipeline accordingly.  

We plan to include full mobile end-to-end testing using [Detox](https://wix.github.io/Detox/) to ensure the entire app behaves correctly on real devices (soon!).
