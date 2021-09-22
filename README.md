<!--
Copyright 2020 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->
# `deploy-clouddeploy` GitHub Action

Deploys pipeline to [Cloud Deploy][cloud-deploy] and makes the URL
available to later build steps via outputs.

> Note that this product Cloud Deploy is in Preview stage

## Prerequisites

This action requires:

* Google Cloud credentials that are authorized to deploy a
Cloud Deploy. See the [Credentials](#credentials) below for more information.

* [Enable the Cloud Deploy API](http://console.cloud.google.com/apis/library/clouddeploy.googleapis.com)

## Usage

```yaml
- name: Deploy to Cloud Deploy
  uses: gcp-cloud-deploy-ecosystem/deploy-clouddeploy@main
```

## Inputs

| Name          | Requirement | Default | Description |
| ------------- | ----------- | ------- | ----------- |
| `region`| _optional_ | `us-central1` | Region in which the resource can be found. |
| `credentials`| Required if not using a the `setup-gcloud` action with exported credentials. | | Service account key to use for authentication. This should be the JSON formatted private key which can be exported from the Cloud Console. The value can be raw or base64-encoded.  |
| `project_id`| _optional_ | | ID of the Google Cloud project. If provided, this will override the project configured by `setup-gcloud`. |
| `file` | _optional_ | `clouddeploy.yaml` | Path to the Cloud Deploy configuration file. |
| `flags` | _optional_ | | Space separated list of other Cloud Deploy flags. |
| `gcloud_version` | _optional_ | `latest` | Pin the version of Cloud SDK `gcloud` CLI. |

## Outputs

- None

## Credentials

There are a few ways to authenticate this action. A service account will be needed
with the following roles:

- Cloud Deploy Admin (`roles/cloudeploy.admin`):
  - Can create, update, and delete pipelines.
  - Approved pipeline executions
  - Can get and set IAM policies.

This service account needs to a member of the `Compute Engine default service account`,
`(PROJECT_NUMBER-compute@developer.gserviceaccount.com)`, with role
`Service Account User`. To grant a user permissions for a service account, use
one of the methods found in [Configuring Ownership and access to a service account](https://cloud.google.com/iam/docs/granting-roles-to-service-accounts#granting_access_to_a_user_for_a_service_account).

### Used with `setup-gcloud`

You can provide credentials using the [setup-gcloud][setup-gcloud] action:

```yaml
- uses: google-github-actions/setup-gcloud@master
  with:
    service_account_key: ${{ secrets.GCP_SA_KEY }}
    export_default_credentials: true

- name: Deploy to Cloud Deploy
  uses: gcp-cloud-deploy-ecosystem/deploy-clouddeploy@main
```

### Via Credentials

You can provide [Google Cloud Service Account JSON][sa] directly to the action
by specifying the `credentials` input. First, create a [GitHub
Secret][gh-secret] that contains the JSON content, then import it into the
action:

```yaml
- name: Deploy to Cloud Deploy
  uses: gcp-cloud-deploy-ecosystem/deploy-clouddeploy@main
```

### Via Application Default Credentials

If you are hosting your runner, **and** those runners are on Google Cloud,
you can leverage the Application Default Credentials of the instance. This will
authenticate requests as the service account attached to the instance. **This
only works using a custom runner hosted on GCP.**

```yaml
- name: Deploy to Cloud Deploy
  uses: gcp-cloud-deploy-ecosystem/deploy-clouddeploy@main
```

## Example Workflows

* [Deploy a prebuilt container](#deploy-a-prebuilt-container)

* [Build and deploy a container](#build-and-deploy-a-container)

### Setup

1.  Create a new Google Cloud Project (or select an existing project).

1. [Enable the Cloud Deploy API](https://console.cloud.google.com/flows/enableapi?apiid=clouddeploy.googleapis.com).

1.  [Create a Google Cloud service account][sa] or select an existing one.

1.  Add the the following [Cloud IAM roles][roles] to your service account:

    - `Cloud Deploy Developer` - allows for the creation of new Cloud Deploy Developer

1.  [Download a JSON service account key][create-key] for the service account.

1.  Add the following [secrets to your repository's secrets][gh-secret]:

    - `GCP_PROJECT`: Google Cloud project ID

    - `GCP_SA_KEY`: the downloaded service account key

## Migrating from `setup-gcloud`

Example using `setup-gcloud`:

```YAML
- name: Setup Cloud SDK
  uses: google-github-actions/setup-gcloud@v0.2.0
  with:
    project_id: ${{ env.PROJECT_ID }}
    service_account_key: ${{ secrets.GCP_SA_KEY }}

- name: Deploy to Cloud Deploy
  run: |-
    gcloud beta deploy apply \
      --region $REGION \
      --file clouddeploy.yaml
```

Migrated to `deploy-clouddeploy`:

```YAML
- name: Deploy to Cloud Deploy
  uses: gcp-cloud-deploy-ecosystem/deploy-clouddeploy@v0.2.0
  with:
    service: ${{ env.SERVICE }}
    image: gcr.io/${{ env.PROJECT_ID }}/${{ env.SERVICE }}
    region: ${{ env.REGION }}
    credentials: ${{ secrets.GCP_SA_KEY }}
    env_vars: NAME="Hello World"
```
## Contributing

See [CONTRIBUTING](CONTRIBUTING.md).

## Acknowledgment

This action was initialally forked [gcp-cloud-deploy-ecosystem/deploy-clouddeploy](https://github.com/gcp-cloud-deploy-ecosystem/deploy-clouddeploy).

## License

See [LICENSE](LICENSE).

[cloud-deploy]: https://cloud.google.com/deploy
[sa]: https://cloud.google.com/iam/docs/creating-managing-service-accounts
[create-key]: https://cloud.google.com/iam/docs/creating-managing-service-account-keys
[gh-runners]: https://help.github.com/en/actions/hosting-your-own-runners/about-self-hosted-runners
[gh-secret]: https://help.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets
[setup-gcloud]: ./setup-gcloud
[artifact-api]: https://console.cloud.google.com/flows/enableapi?apiid=artifactregistry.googleapis.com&redirect=https://cloud.google.com/artifact-registry/docs/docker/quickstart&_ga=2.234012894.1325218733.1623704963-2035038643.1623704963
[repo]: https://cloud.google.com/artifact-registry/docs/manage-repos
