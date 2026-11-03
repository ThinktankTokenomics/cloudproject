# TrustGate: Short Explanation and Viva Notes

## 60-second explanation

“My project is called TrustGate. It demonstrates a secure CI/CD pipeline for a small Node.js web API. When I open a pull request, GitHub Actions runs the API tests, checks the dependencies, scans the source for secrets and vulnerabilities, and checks the Dockerfile. If the change reaches `main`, the pipeline builds a Docker image and scans it. A passing image is pushed to GitHub Container Registry. The registry returns a SHA-256 digest, and the workflow asks Render to deploy that exact digest. This avoids deploying an image based only on a changeable tag such as `latest`.”

## Flow in simple steps

1. I push code or open a pull request.
2. GitHub Actions runs the tests, dependency check, source scan, and Dockerfile check.
3. It builds and scans a validation image; a failed check stops the release.
4. On `main`, the pipeline rebuilds and scans the release image.
5. If the image passes, it is pushed to GitHub Container Registry.
6. The registry returns a SHA-256 digest for that image.
7. The workflow sends the digest to Render for deployment.
8. The dashboard shows the running app's health and commit version.

## Common questions

### What does CI/CD mean?

CI means Continuous Integration. It automatically checks changes when code is updated. CD means Continuous Delivery or Deployment. It moves a passing release toward the cloud host.

### Why did you use Docker?

Docker packages the app and its Node.js runtime together. The same container image can be scanned, stored, and run on another host.

### What is SHA-256 doing here?

It creates a fixed-length fingerprint for the image. The pipeline uses the registry's image digest to identify the exact image that passed the container scan.

### Is a hash the same as encryption?

No. Encryption hides information and can be reversed with a key. A hash is a one-way fingerprint. It helps identify changes, but it does not hide the image.

### Does the digest prove who created the image?

No. A digest identifies the image contents. A digital signature or build attestation would be needed to verify the producer or build process.

### Why not deploy using `latest`?

The `latest` tag can point to different image contents at different times. A digest identifies one image exactly, so the deployment request refers to the image that was scanned.

### What happens if a security scan fails?

The workflow exits with a failure. The image is not published, and the deploy job does not run.

### Why does the container run as `node`?

It follows the principle of least privilege. If the app is compromised, it does not begin with the full permissions of the container's root user.

### Where are the Render credentials stored?

They are stored as GitHub repository secrets. They are not written in the code or copied into the image.

### Does this use AWS ECS or Fargate?

No. The app image is stored in GitHub Container Registry and the optional deployment target is Render.

### Is this production-ready?

It is a learning project that demonstrates useful controls. A production system also needs protected branch rules, review, image signatures or attestations, monitoring, rollback plans, and a defined vulnerability response process.

## Demonstration checklist

- Show the dashboard at `/`.
- Open `/health` and `/api/status`.
- Show the test and scan jobs in a GitHub Actions run.
- Show the SHA-256 digest recorded in the publish job output.
- If Render is configured, show the deployed app and its commit version.
- Explain that a failed gate prevents image publication and deployment.
