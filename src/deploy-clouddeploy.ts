/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as toolCache from '@actions/tool-cache';
import * as setupGcloud from './setup-google-cloud-sdk/src';
import path from 'path';

export const GCLOUD_METRICS_ENV_VAR = 'CLOUDSDK_METRICS_ENVIRONMENT';
export const GCLOUD_METRICS_LABEL = 'github-actions-deploy-cloudrun';

/**
 * Executes the main action. It includes the main business logic and is the
 * primary entry point. It is documented inline.
 */
export async function run(): Promise<void> {
  core.exportVariable(GCLOUD_METRICS_ENV_VAR, GCLOUD_METRICS_LABEL);
  try {
    // Get inputs
    // Core inputs
    const credentials = core.getInput('credentials'); // Service account key
    let projectId = core.getInput('project_id');
    let gcloudVersion = core.getInput('gcloud_version');
    // Flags
    const region = core.getInput('region') || 'us-central1';
    const file = core.getInput('file'); // Path to the Cloud Deploy configuration file
    const flags = core.getInput('flags');

    // Flag for installing gcloud beta components
    // Currently, the deploy command is only supported in the beta command
    const installBeta = true;
    let cmd;

    cmd = ['deploy', 'apply', '--file', file, '--quiet', '--region', region];

    // Add optional flags
    if (flags) {
      const flagList = parseFlags(flags);
      if (flagList) cmd = cmd.concat(flagList);
    }

    // Install gcloud if not already installed.
    if (!gcloudVersion || gcloudVersion == 'latest') {
      gcloudVersion = await setupGcloud.getLatestGcloudSDKVersion();
    }
    if (!setupGcloud.isInstalled(gcloudVersion)) {
      await setupGcloud.installGcloudSDK(gcloudVersion);
    } else {
      const toolPath = toolCache.find('gcloud', gcloudVersion);
      core.addPath(path.join(toolPath, 'bin'));
    }

    // Authenticate gcloud SDK.
    if (credentials) await setupGcloud.authenticateGcloudSDK(credentials);
    const authenticated = await setupGcloud.isAuthenticated();
    if (!authenticated) {
      throw new Error('Error authenticating the Cloud SDK.');
    }

    // set PROJECT ID
    if (projectId) {
      await setupGcloud.setProject(projectId);
    } else if (credentials) {
      projectId = await setupGcloud.setProjectWithKey(credentials);
    } else if (process.env.GCLOUD_PROJECT) {
      await setupGcloud.setProject(process.env.GCLOUD_PROJECT);
    }
    // Fail if no Project Id is provided if not already set.
    const projectIdSet = await setupGcloud.isProjectIdSet();
    if (!projectIdSet)
      throw new Error(
        'No project Id provided. Ensure you have set either the project_id or credentials fields.',
      );

    // Install beta components if needed and prepend the beta command
    if (installBeta) {
      await setupGcloud.installComponent('beta');
      cmd.unshift('beta');
    }

    const toolCommand = setupGcloud.getToolCommand();

    // Get output of gcloud cmd.
    let output = '';
    const stdout = (data: Buffer): void => {
      output += data.toString();
    };
    let errOutput = '';
    const stderr = (data: Buffer): void => {
      errOutput += data.toString();
    };

    const options = {
      listeners: {
        stderr,
        stdout,
      },
      silent: true,
    };
    core.info(`running: ${toolCommand} ${cmd.join(' ')}`);
    // Run gcloud cmd.
    try {
      await exec.exec(toolCommand, cmd, options);
      // Set url as output.
      setUrlOutput(output + errOutput);
    } catch (err: any) {
      if (errOutput) {
        throw new Error(errOutput);
      } else {
        throw new Error(err);
      }
    }
  } catch (err: any) {
    core.setFailed(err.message);
  }
}

export function setUrlOutput(output: string): string | undefined {
  // regex to match Cloud Run URLs
  const urlMatch = output.match(
    /https:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.app/g,
  );
  if (!urlMatch) {
    core.warning('Can not find URL.');
    return undefined;
  }
  // Match "tagged" URL or default to service URL
  const url = urlMatch!.length > 1 ? urlMatch![1] : urlMatch![0];
  core.setOutput('url', url);
  return url;
}

export function parseFlags(flags: string): RegExpMatchArray {
  return flags.match(/(".*?"|[^"\s=]+)+(?=\s*|\s*$)/g)!; // Split on space or "=" if not in quotes
}
