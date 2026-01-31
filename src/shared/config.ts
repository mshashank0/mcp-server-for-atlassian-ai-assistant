import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (two levels up from src/shared/)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export interface ServiceConfig {
  baseUrl: string;
  apiToken: string;
}

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is not set`);
  }
  return value;
}

// Lazy evaluation to avoid requiring all env vars at startup
export const getConfluenceConfig = (): ServiceConfig => ({
  baseUrl: getEnvVar('CONFLUENCE_BASE_URL'),
  apiToken: getEnvVar('CONFLUENCE_API_TOKEN'),
});

export const getJiraConfig = (): ServiceConfig => ({
  baseUrl: getEnvVar('JIRA_BASE_URL'),
  apiToken: getEnvVar('JIRA_API_TOKEN'),
});

export const getBitbucketConfig = (): ServiceConfig => ({
  baseUrl: getEnvVar('BITBUCKET_BASE_URL'),
  apiToken: getEnvVar('BITBUCKET_API_TOKEN'),
});

export const getArgoWorkflowsConfig = (): ServiceConfig => ({
  baseUrl: getEnvVar('ARGO_WORKFLOW_BASE_URL'),
  apiToken: getEnvVar('ARGO_WORKFLOW_API_TOKEN'),
});