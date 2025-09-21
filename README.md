# Uptime Monitoring Home Assignment

This repository contains a lightweight uptime monitoring prototype built on top of the provided serverless template. It keeps the original deployment model (AWS Lambda, API Gateway, DynamoDB, Cognito, S3 hosted React frontend) while reshaping the product to manage multi-tenant health checks.

## Architecture decisions

- **AWS Serverless Framework** – keeps deployment friction low while staying within the original template. Infrastructure as code is handled via the Serverless Framework so updates remain reproducible.
- **Lambda + API Gateway** – each API endpoint is an AWS Lambda function that scales on demand and is protected by the existing Cognito authoriser. API Gateway continues to expose a single HTTPS endpoint for the frontend.
- **DynamoDB for state** – a single table (`${service}-${stage}-endpoints`) stores endpoint definitions and their most recent health state. Partitioning by the authenticated owner keeps requests scoped per customer administrator while allowing multiple tenants and categories per account.
- **CheckEndpoint utility** – a reusable TypeScript helper (with Jest + Nock unit tests) encapsulates HTTP GET checks, timeout handling, non-2xx detection and network failures. Lambda handlers reuse it so behaviour is consistent across the system.
- **React + Amplify UI** – the frontend is still a single page React app hosted on S3/CloudFront. It authenticates through Cognito, persists endpoints via the API and shows grouped health information using Ant Design components.

## Product considerations & assumptions

- **Multi-tenant data model** – each record captures a `tenantId`, `category`, friendly `name`, and target `url`. The authenticated user acts as the “owner” so different customers can be modelled by storing several tenants under a single account.
- **Status evaluation** – the first iteration keeps checks synchronous: every time the list view loads (or refresh is pressed) the backend replays the `CheckEndpoint` function for all saved endpoints and stores the latest outcome (`status`, `statusCode`, `responseTimeMs`, `statusSince`, `lastCheckedAt`). A background scheduler would be the next evolution.
- **Colour & duration cues** – the UI highlights health in green/red and displays how long the endpoint has been in the current state plus the time of the last probe. Unknown status indicates the endpoint has not been checked yet.
- **Manual escalation** – automated paging/escalation flows are intentionally out of scope for the initial cut. The architecture section in this README calls out where SNS/Slack/Webhooks could later plug in once product requirements firm up.
- **Input validation** – timeout is optional and defaults to 5 seconds server-side. URLs are validated in the UI and backend to avoid malformed entries. Additional attributes (expected status codes, headers, auth strategies) were considered out of scope for the first pass.
- **Ambiguities for follow-up**:
  - Notification rules (channels, schedules, suppression windows) need product definition.
  - Retention of historical checks and reporting cadence is undefined.
  - Tenant ownership/role-based access is assumed to mirror Cognito users but likely needs refinement for shared operations teams.

## Repository layout

```
backend/   # Serverless Lambda functions and DynamoDB access layer
frontend/  # React + Amplify UI for managing and viewing endpoints
```

Key files:

- `backend/src/lib/check-endpoint.ts` – reusable HTTP checker.
- `backend/__tests__/check-endpoint.test.ts` – Jest tests covering success, non-2xx, timeout, network error and invalid URL cases.
- `frontend/src/components/AppContent.tsx` – main React view with endpoint form and grouped status cards.

## Local development

1. Install dependencies inside each workspace (`npm install`).
2. Configure the same environment variables as the original template (Cognito IDs and API endpoint).
3. Run the frontend with `npm start` inside `frontend/` for local development.

## Testing

Run the backend unit tests for the `CheckEndpoint` helper:

```bash
cd backend
npm test
```

The frontend relies on manual verification for this assignment; the UI is intentionally kept minimal to reflect a 2–3 hour implementation window.
