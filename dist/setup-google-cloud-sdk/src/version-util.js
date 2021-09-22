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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLatestGcloudSDKVersion = void 0;
/**
 * Contains version utility functions.
 */
const httpm = __importStar(require("typed-rest-client/HttpClient"));
const attempt_1 = require("@lifeomic/attempt");
/**
 * @returns The latest stable version of the gcloud SDK.
 */
function getLatestGcloudSDKVersion() {
    return __awaiter(this, void 0, void 0, function* () {
        const queryUrl = 'https://dl.google.com/dl/cloudsdk/channels/rapid/components-2.json';
        const client = new httpm.HttpClient('github-actions-setup-gcloud-sdk');
        return yield (0, attempt_1.retry)(() => __awaiter(this, void 0, void 0, function* () {
            const res = yield client.get(queryUrl);
            if (res.message.statusCode != 200) {
                throw new Error(`Failed to retrieve gcloud SDK version, HTTP error code: ${res.message.statusCode} url: ${queryUrl}`);
            }
            const body = yield res.readBody();
            const responseObject = JSON.parse(body);
            if (!responseObject.version) {
                throw new Error(`Failed to retrieve gcloud SDK version, invalid response body: ${body}`);
            }
            return responseObject.version;
        }), {
            delay: 200,
            factor: 2,
            maxAttempts: 4,
        });
    });
}
exports.getLatestGcloudSDKVersion = getLatestGcloudSDKVersion;
