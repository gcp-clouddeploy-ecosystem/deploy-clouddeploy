"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFlags = exports.setUrlOutput = exports.run = exports.GCLOUD_METRICS_LABEL = exports.GCLOUD_METRICS_ENV_VAR = void 0;
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const toolCache = __importStar(require("@actions/tool-cache"));
const setupGcloud = __importStar(require("./setup-google-cloud-sdk/src"));
const path_1 = __importDefault(require("path"));
exports.GCLOUD_METRICS_ENV_VAR = 'CLOUDSDK_METRICS_ENVIRONMENT';
exports.GCLOUD_METRICS_LABEL = 'github-actions-deploy-cloudrun';
/**
 * Executes the main action. It includes the main business logic and is the
 * primary entry point. It is documented inline.
 */
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        core.exportVariable(exports.GCLOUD_METRICS_ENV_VAR, exports.GCLOUD_METRICS_LABEL);
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
                if (flagList)
                    cmd = cmd.concat(flagList);
            }
            // Install gcloud if not already installed.
            if (!gcloudVersion || gcloudVersion == 'latest') {
                gcloudVersion = yield setupGcloud.getLatestGcloudSDKVersion();
            }
            if (!setupGcloud.isInstalled(gcloudVersion)) {
                yield setupGcloud.installGcloudSDK(gcloudVersion);
            }
            else {
                const toolPath = toolCache.find('gcloud', gcloudVersion);
                core.addPath(path_1.default.join(toolPath, 'bin'));
            }
            // Authenticate gcloud SDK.
            if (credentials)
                yield setupGcloud.authenticateGcloudSDK(credentials);
            const authenticated = yield setupGcloud.isAuthenticated();
            if (!authenticated) {
                throw new Error('Error authenticating the Cloud SDK.');
            }
            // set PROJECT ID
            if (projectId) {
                yield setupGcloud.setProject(projectId);
            }
            else if (credentials) {
                projectId = yield setupGcloud.setProjectWithKey(credentials);
            }
            else if (process.env.GCLOUD_PROJECT) {
                yield setupGcloud.setProject(process.env.GCLOUD_PROJECT);
            }
            // Fail if no Project Id is provided if not already set.
            const projectIdSet = yield setupGcloud.isProjectIdSet();
            if (!projectIdSet)
                throw new Error('No project Id provided. Ensure you have set either the project_id or credentials fields.');
            // Install beta components if needed and prepend the beta command
            if (installBeta) {
                yield setupGcloud.installComponent('beta');
                cmd.unshift('beta');
            }
            const toolCommand = setupGcloud.getToolCommand();
            // Get output of gcloud cmd.
            let output = '';
            const stdout = (data) => {
                output += data.toString();
            };
            let errOutput = '';
            const stderr = (data) => {
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
                yield exec.exec(toolCommand, cmd, options);
                // Set url as output.
                setUrlOutput(output + errOutput);
            }
            catch (err) {
                if (errOutput) {
                    throw new Error(errOutput);
                }
                else {
                    throw new Error(err);
                }
            }
        }
        catch (err) {
            core.setFailed(err.message);
        }
    });
}
exports.run = run;
function setUrlOutput(output) {
    // regex to match Cloud Run URLs
    const urlMatch = output.match(/https:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.app/g);
    if (!urlMatch) {
        core.warning('Can not find URL.');
        return undefined;
    }
    // Match "tagged" URL or default to service URL
    const url = urlMatch.length > 1 ? urlMatch[1] : urlMatch[0];
    core.setOutput('url', url);
    return url;
}
exports.setUrlOutput = setUrlOutput;
function parseFlags(flags) {
    return flags.match(/(".*?"|[^"\s=]+)+(?=\s*|\s*$)/g); // Split on space or "=" if not in quotes
}
exports.parseFlags = parseFlags;
