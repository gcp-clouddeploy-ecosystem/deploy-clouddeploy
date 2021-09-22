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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEST_SDK_VERSION = exports.TEST_SDK_VERSIONS = exports.TestToolCache = void 0;
/**
 * A collection of utility functions for testing.
 */
const path = __importStar(require("path"));
/**
 * Creates an overridden runner cache and tool path. This is slightly
 * complicated by the fact that the runner initializes its cache path exactly
 * once at startup, so this must be imported and called BEFORE the toolcache is
 * used.
 */
class TestToolCache {
    /**
     * Creates temporary directories for the runner cache and temp, and configures
     * the Action's runner to use said directories.
     *
     * @returns two strings - first is overridden toolsPath, second is tempPath.
     */
    static override() {
        var _a;
        if (((_a = this.paths) === null || _a === void 0 ? void 0 : _a.length) > 0) {
            return this.paths;
        }
        const rootPath = path.join(__dirname, 'runner', this.randomStr());
        const toolsPath = path.join(rootPath, 'tools');
        process.env.RUNNER_TOOL_CACHE = toolsPath;
        const tempPath = path.join(rootPath, 'temp');
        process.env.RUNNER_TEMP = tempPath;
        this.paths = [toolsPath, tempPath];
        return this.paths;
    }
    static randomStr() {
        return Math.random()
            .toString(36)
            .substring(8);
    }
}
exports.TestToolCache = TestToolCache;
/**
 * The version of the gcloud SDK being tested against.
 */
exports.TEST_SDK_VERSIONS = ['0.9.83', '270.0.0', '272.0.0', '275.0.0'];
exports.TEST_SDK_VERSION = exports.TEST_SDK_VERSIONS[exports.TEST_SDK_VERSIONS.length - 1];
