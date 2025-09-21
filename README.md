# Uptime Monitoring Home Assignment

This repository contains a lightweight uptime monitoring prototype. It runs on AWS Lambda, API Gateway, DynamoDB, Cognito, and an S3 hosted React frontend to manage multi-tenant health checks.

## Architecture decisions

- **AWS Serverless Framework** – defines infrastructure as code so deployments stay simple and repeatable.
- **Lambda + API Gateway** – each API endpoint is an AWS Lambda function that scales on demand and is protected by the Cognito authoriser. API Gateway exposes a single HTTPS endpoint for the frontend.
- **DynamoDB for state** – a single table (`${service}-${stage}-endpoints`) stores endpoint definitions and their most recent health state. Partitioning by the authenticated owner keeps requests scoped per customer administrator while allowing multiple tenants and categories per account.
- **CheckEndpoint utility** – a reusable TypeScript helper (with Jest + Nock unit tests) encapsulates HTTP GET checks, timeout handling, non-2xx detection and network failures. Lambda handlers reuse it so behaviour is consistent across the system.
- **React + Amplify UI** – the frontend is a single page React app hosted on S3. It authenticates through Cognito, persists endpoints via the API and shows grouped health information using Ant Design components.

## Product considerations & assumptions

- **Multi-tenant data model** – each record captures a `tenantId`, `category`, friendly `name`, and target `url`. The authenticated user acts as the “owner” so different customers can be modelled by storing several tenants under a single account.
- **Status evaluation** – the first iteration keeps checks synchronous: every time the list view loads (or refresh is pressed) the backend replays the `CheckEndpoint` function for all saved endpoints and stores the latest outcome (`status`, `statusCode`, `responseTimeMs`, `statusSince`, `lastCheckedAt`). A background scheduler would be the next evolution.
- **Colour & duration cues** – the UI highlights health in green/red and displays how long the endpoint has been in the current state plus the time of the last probe. Unknown status indicates the endpoint has not been checked yet.
- **Manual escalation** – automated paging/escalation flows are intentionally out of scope for the initial cut. The architecture section in this README calls out where SNS/Slack/Webhooks could later plug in once product requirements firm up.
- **Input validation** – timeout is optional and defaults to 5 seconds server-side. URLs are validated in the UI and backend to avoid malformed entries. Additional attributes (expected status codes, headers, auth strategies) were considered out of scope for the first pass.
- **Ambiguities for follow-up**:
  - Notification rules (channels, schedules, suppression windows) need product definition.
  - Retention of historical checks and reporting schedule is undefined.
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
2. Configure environment variables for Cognito IDs and the API endpoint.
3. Run the frontend with `npm start` inside `frontend/` for local development.

## Testing

Run the backend unit tests for the `CheckEndpoint` helper:

```bash
cd backend
npm test
```

The frontend relies on manual verification for this assignment; the UI is intentionally kept minimal to reflect a 2–3 hour implementation window.

## QA health check endpoint

The deployment also exposes a public `/health-qa` Lambda that intentionally returns a mix of fast successes, slow responses, 4xx/5xx errors, redirects, and even simulated timeouts/exceptions. It is meant for validating that monitoring or alerting rules react correctly to unpredictable behaviour.

To exercise it after deploying the stack:

1. Capture the base URL of the API Gateway stage. You can run `npx serverless info --stage <stage>` from the `backend/` folder or open the API in the AWS console to copy the base invoke URL (for example `https://abc123.execute-api.us-east-1.amazonaws.com/dev`).
2. Append `/health-qa` to that base URL to form the full endpoint (for example `https://abc123.execute-api.us-east-1.amazonaws.com/dev/health-qa`).
3. Call the URL from your browser or using a tool like `curl`/Postman to observe the randomly selected scenario on each request.

## Deployment & operations

### Architecture choices

As discussed in the zoom I made it "My Own" So I can showcase my way of thinking and how I would approach this kind of task.

- serverless framework as my IaC to be able to update and redeploy changes easily.
- Lambda for scalability and simplicity (Not having to manage Containers lifecycle)
- API Gateway
  - Fully managed makes it easy for developers to create, publish, maintain, monitor
  - Secure APIs at any scale.
  - Input schema validation capabilities.
- Cognito and Amplify for authentication and authorisation
  - Offers user interface
  - Scalability and Security
  - Simple Integration with AWS Services
- S3 as the static website hosting
  - Cost-Effective Hosting
  - High Scalability and Availability
  - Easy Deployment and Maintenance
  - Simple to Update
- For CI/CD i am using GitHub actions
  - to streamline the deployment process so the BE and FE are updated automatically on every 'master' push.

### Gaps and Nice to Haves

- Static website hosting in s3
  - currently it uses http protocol and not https. I would have set certificate to make it https
- React:
  - The code could be much cleaner and be split into smaller components and files.
  - Could have used a modern state management and lifecycle tool like redux or react-query.
  - Nicer layout with proper CSS
  - Fetching by clicking the next page and not the NEXT button.
  - Saved repos are not automatically updated with the current number of stars (could be nice to implement)
- CI/CD
  - Could be nice to skip backend or frontend in no code was changed in either respectively
  - Create env per PR for testing before merging to master

### Fork the Repository

To run this project in your own AWS account, you should first fork this repository:

1. Navigate to this repository on GitHub.
2. Click the "Fork" button in the top-right corner of the page.

### Prerequisites

- AWS Account
- GitHub Account

### Setting up a Development Environment in GitHub

The simplified workflow can be dispatched without configuring repository environments or secrets. You only need temporary AWS credentials with permission to deploy the Serverless stack and the name of an S3 bucket for the frontend. (If you prefer automated deployments on every push to `master`, you can still store these values as repository secrets or variables and the workflow will fall back to them.)

### Setup Environment Variables in GitHub

There are no persistent variables to configure. Instead, collect the values below so you can paste them into the workflow form when you trigger a deployment:

- **AWS_ACCESS_KEY_ID** – AWS IAM user access key ID with the necessary permissions.
- **AWS_SECRET_ACCESS_KEY** – Secret key that matches the access key above.
- **WEBAPP_BUCKET** – Unique S3 bucket name that will host the React frontend (for example `my-uptime-demo-bucket`).
- **AWS_REGION** *(optional)* – Region for the deployment (defaults to `us-east-1`).
- **STAGE** *(optional)* – Serverless stage name (defaults to `dev`).

### Creating a Secured Variable in AWS

No additional Parameter Store or Secrets Manager values are required. The workflow writes the credentials you provide into the runner's temporary AWS profile for the duration of the job.

### Deploying the Application

The application is deployed using GitHub Actions. The workflow still runs on pushes to the `master` branch when repository credentials are available, but reviewers can deploy manually without any repository configuration:

1. Go to the "Actions" tab in your GitHub repository and select the **Deploy Dev** workflow.
2. Click **Run workflow**, supply the AWS access key ID, secret access key, and S3 bucket name (plus optional region or stage) in the input fields, and confirm.
3. Click **Run workflow** again to start the job. The workflow deploys the backend with Serverless, generates the frontend `.env`, builds the React app, and uploads the artefacts to the chosen bucket.

The endpoint to access the app will be available at the S3 static website URL for the bucket you provided (for example `http://{WEBAPP_BUCKET}.s3-website-us-east-1.amazonaws.com` when using the default region).
