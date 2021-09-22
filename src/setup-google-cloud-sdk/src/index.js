"use strict";
/*
 * Copyright 2019 Google LLC
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.installComponent = exports.setProjectWithKey = exports.setProject = exports.authenticateGcloudSDK = exports.parseServiceAccountKey = exports.installGcloudSDK = exports.isAuthenticated = exports.isProjectIdSet = exports.getToolCommand = exports.isInstalled = exports.getLatestGcloudSDKVersion = void 0;
const exec = __importStar(require("@actions/exec"));
const toolCache = __importStar(require("@actions/tool-cache"));
const os = __importStar(require("os"));
const tmp = __importStar(require("tmp"));
const format_url_1 = require("./format-url");
const downloadUtil = __importStar(require("./download-util"));
const installUtil = __importStar(require("./install-util"));
const version_util_1 = require("./version-util");
Object.defineProperty(exports, "getLatestGcloudSDKVersion", { enumerable: true, get: function () { return version_util_1.getLatestGcloudSDKVersion; } });
/**
 * Checks if gcloud is installed.
 *
 * @param version (Optional) Cloud SDK version.
 * @return true if gcloud is found in toolpath.
 */
function isInstalled(version) {
    let toolPath;
    if (version) {
        toolPath = toolCache.find('gcloud', version);
        return toolPath != undefined && toolPath !== '';
    }
    else {
        toolPath = toolCache.findAllVersions('gcloud');
        return toolPath.length > 0;
    }
}
exports.isInstalled = isInstalled;
/**
 * Returns the correct gcloud command for OS.
 *
 * @returns gcloud command.
 */
function getToolCommand() {
    // A workaround for https://github.com/actions/toolkit/issues/229
    // Currently exec on windows runs as cmd shell.
    let toolCommand = 'gcloud';
    if (process.platform == 'win32') {
        toolCommand = 'gcloud.cmd';
    }
    return toolCommand;
}
exports.getToolCommand = getToolCommand;
/**
 * Checks if the project Id is set in the gcloud config.
 *
 * @returns true is project Id is set.
 */
function isProjectIdSet() {
    return __awaiter(this, void 0, void 0, function* () {
        // stdout captures project id
        let output = '';
        const stdout = (data) => {
            output += data.toString();
        };
        // stderr captures "(unset)"
        let errOutput = '';
        const stderr = (data) => {
            errOutput += data.toString();
        };
        const options = {
            listeners: {
                stdout,
                stderr,
            },
            silent: true,
        };
        const toolCommand = getToolCommand();
        yield exec.exec(toolCommand, ['config', 'get-value', 'project'], options);
        return !(output.includes('unset') || errOutput.includes('unset'));
    });
}
exports.isProjectIdSet = isProjectIdSet;
/**
 * Checks if gcloud is authenticated.
 *
 * @returns true is gcloud is authenticated.
 */
function isAuthenticated() {
    return __awaiter(this, void 0, void 0, function* () {
        let output = '';
        const stdout = (data) => {
            output += data.toString();
        };
        const options = {
            listeners: {
                stdout,
            },
            silent: true,
        };
        const toolCommand = getToolCommand();
        yield exec.exec(toolCommand, ['auth', 'list'], options);
        return !output.includes('No credentialed accounts.');
    });
}
exports.isAuthenticated = isAuthenticated;
/**
 * Installs the gcloud SDK into the actions environment.
 *
 * @param version The version being installed.
 * @returns The path of the installed tool.
 */
function installGcloudSDK(version) {
    return __awaiter(this, void 0, void 0, function* () {
        // Retreive the release corresponding to the specified version and OS
        const osPlat = os.platform();
        const osArch = os.arch();
        const url = yield (0, format_url_1.getReleaseURL)(osPlat, osArch, version);
        // Download and extract the release
        const extPath = yield downloadUtil.downloadAndExtractTool(url);
        if (!extPath) {
            throw new Error(`Failed to download release, url: ${url}`);
        }
        // Install the downloaded release into the github action env
        return yield installUtil.installGcloudSDK(version, extPath);
    });
}
exports.installGcloudSDK = installGcloudSDK;
/**
 * Parses the service account string into JSON.
 *
 * @param serviceAccountKey The service account key used for authentication.
 * @returns ServiceAccountKey as an object.
 */
function parseServiceAccountKey(serviceAccountKey) {
    let serviceAccount = serviceAccountKey;
    // Handle base64-encoded credentials
    if (!serviceAccountKey.trim().startsWith('{')) {
        serviceAccount = Buffer.from(serviceAccountKey, 'base64').toString('utf8');
    }
    try {
        return JSON.parse(serviceAccount);
    }
    catch (error) {
        const keyFormat = `
    {
      "type": "service_account",
      "project_id": "project-id",
      "private_key_id": "key-id",
      "private_key": "-----BEGIN PRIVATE KEY-----\\nprivate-key\\n-----END PRIVATE KEY-----\\n",
      "client_email": "service-account-email",
      "client_id": "client-id",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://accounts.google.com/o/oauth2/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/service-account-email"
    }
    `;
        const message = 'Error parsing credentials: ' +
            error.message +
            '\nEnsure your credentials are base64 encoded or validate JSON format: ' +
            keyFormat;
        throw new Error(message);
    }
}
exports.parseServiceAccountKey = parseServiceAccountKey;
/**
 * Authenticates the gcloud tool using a service account key.
 *
 * @param serviceAccountKey The service account key used for authentication.
 * @returns exit code.
 */
function authenticateGcloudSDK(serviceAccountKey) {
    return __awaiter(this, void 0, void 0, function* () {
        tmp.setGracefulCleanup();
        const serviceAccountJson = parseServiceAccountKey(serviceAccountKey);
        const serviceAccountEmail = serviceAccountJson.client_email;
        const toolCommand = getToolCommand();
        // Authenticate as the specified service account.
        const options = {
            input: Buffer.from(JSON.stringify(serviceAccountJson)),
            silent: true,
        };
        return yield exec.exec(toolCommand, [
            '--quiet',
            'auth',
            'activate-service-account',
            serviceAccountEmail,
            '--key-file',
            '-',
        ], options);
    });
}
exports.authenticateGcloudSDK = authenticateGcloudSDK;
/**
 * Sets the GCP Project Id in the gcloud config.
 *
 * @param serviceAccountKey The service account key used for authentication.
 * @returns project ID.
 */
function setProject(projectId) {
    return __awaiter(this, void 0, void 0, function* () {
        const toolCommand = getToolCommand();
        const options = {
            silent: true,
        };
        return yield exec.exec(toolCommand, ['--quiet', 'config', 'set', 'project', projectId], options);
    });
}
exports.setProject = setProject;
/**
 * Sets the GCP Project Id in the gcloud config.
 *
 * @param serviceAccountKey The service account key used for authentication.
 * @returns project ID.
 */
function setProjectWithKey(serviceAccountKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const serviceAccountJson = parseServiceAccountKey(serviceAccountKey);
        yield setProject(serviceAccountJson.project_id);
        return serviceAccountJson.project_id;
    });
}
exports.setProjectWithKey = setProjectWithKey;
function installComponent(component) {
    return __awaiter(this, void 0, void 0, function* () {
        const toolCommand = getToolCommand();
        const options = {
            silent: true,
        };
        yield exec.exec(toolCommand, ['--quiet', 'components', 'install', component], options);
    });
}
exports.installComponent = installComponent;
