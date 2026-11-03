const connectionPill = document.querySelector('#connection-pill');
const connectionLabel = document.querySelector('#connection-label');
const serviceDot = document.querySelector('#service-dot');
const serviceStatus = document.querySelector('#service-status');
const serviceName = document.querySelector('#service-name');
const versionValue = document.querySelector('#version-value');
const commitValue = document.querySelector('#commit-value');
const runtimeValue = document.querySelector('#runtime-value');
const updatedAt = document.querySelector('#updated-at');

function setConnectionState(state, label) {
  connectionPill.dataset.state = state;
  serviceDot.dataset.state = state;
  connectionLabel.textContent = label;
}

async function loadServiceStatus() {
  try {
    const response = await fetch('/api/status', {
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Status request returned ${response.status}`);
    }

    const data = await response.json();
    setConnectionState('healthy', 'Connected');
    serviceStatus.textContent = data.status === 'healthy' ? 'Service is healthy' : 'Service needs attention';
    serviceName.textContent = data.service;
    versionValue.textContent = data.version;
    commitValue.textContent = data.build.shortCommit;
    runtimeValue.textContent = data.runtime;
    updatedAt.textContent = `Started ${new Date(data.startedAt).toLocaleString()}`;
  } catch {
    setConnectionState('error', 'Unavailable');
    serviceStatus.textContent = 'Could not reach the API';
    serviceName.textContent = 'Check the deployment or start the app locally';
    updatedAt.textContent = 'The status request did not complete.';
  }
}

loadServiceStatus();
