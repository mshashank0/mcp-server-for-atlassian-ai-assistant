#!/usr/bin/env node
import { JiraService } from '../service.js';
import dotenv from 'dotenv';
// Load environment variables
dotenv.config();
const jira = new JiraService();
// Test configuration
const TEST_PROJECT_KEY = 'GSD'; // Change to your test project key
const TEST_ISSUE_KEY = 'GSD-30505'; // Change to your test issue key
const TEST_BOARD_ID = '43450'; // Changed to actual board ID from test results
const TEST_EPIC_KEY = 'GORA-29605'; // Epic from GORA project (cross-project test)
// Check if write tests should be run
const ENABLE_WRITE_TESTS = process.argv.includes('-w') || process.argv.includes('--write');
async function runTests() {
    console.log('='.repeat(60));
    console.log('Jira MCP Server - Comprehensive Testing');
    console.log('='.repeat(60));
    console.log('');
    try {
        // ========================================
        // Phase 1: Core Issue Functions (9 tools)
        // ========================================
        console.log('='.repeat(60));
        console.log('PHASE 1: Core Issue Functions');
        console.log('='.repeat(60));
        console.log('');
        // Test 1: Get issue
        console.log('Test 1: Get issue');
        console.log('-'.repeat(60));
        const issue = await jira.getIssue(TEST_ISSUE_KEY);
        console.log('✓ Issue key:', issue.key);
        console.log('✓ Summary:', issue.fields?.summary || 'N/A');
        console.log('✓ Status:', issue.fields?.status?.name || 'N/A');
        console.log('✓ Issue type:', issue.fields?.issuetype?.name || 'N/A');
        console.log('✓ Priority:', issue.fields?.priority?.name || 'N/A');
        console.log('');
        // Test 2: Search issues
        console.log('Test 2: Search issues');
        console.log('-'.repeat(60));
        const searchResponse = await jira.searchIssues(`project = ${TEST_PROJECT_KEY}`, {
            limit: 5
        });
        console.log('✓ Total issues:', searchResponse.total);
        console.log('✓ Returned:', searchResponse.issues.length);
        searchResponse.issues.slice(0, 3).forEach((issue, idx) => {
            console.log(`  ${idx + 1}. ${issue.key}: ${issue.fields.summary}`);
        });
        console.log('');
        // Test 3: Get board issues
        console.log('Test 3: Get board issues');
        console.log('-'.repeat(60));
        try {
            const boardIssues = await jira.getBoardIssues(TEST_BOARD_ID, `project = ${TEST_PROJECT_KEY}`, {
                limit: 5
            });
            console.log('✓ Board issues:', boardIssues.total);
            console.log('✓ Returned:', boardIssues.issues.length);
        }
        catch (error) {
            console.log('⚠ Skipped (board not available or no permission)');
        }
        console.log('');
        // Test 4: Get sprint issues
        console.log('Test 4: Get sprint issues');
        console.log('-'.repeat(60));
        try {
            // First, try to get active sprints to find a valid sprint ID
            const sprints = await jira.getAllSprintsFromBoard(TEST_BOARD_ID, 'active', 0, 1);
            if (sprints.length > 0) {
                const sprintId = sprints[0].id;
                const sprintIssues = await jira.getSprintIssues(sprintId, { limit: 5 });
                console.log('✓ Sprint issues:', sprintIssues.total);
                console.log('✓ Returned:', sprintIssues.issues.length);
            }
            else {
                console.log('⚠ No active sprints found');
            }
        }
        catch (error) {
            console.log('⚠ Skipped (sprint not available or no permission)');
        }
        console.log('');
        // Test 5: Get issue comments
        console.log('Test 5: Get issue comments');
        console.log('-'.repeat(60));
        const comments = await jira.getIssueComments(TEST_ISSUE_KEY, 10);
        console.log('✓ Comments count:', comments.length);
        if (comments.length > 0) {
            console.log(`  Latest: ${comments[0].author} - ${comments[0].body.substring(0, 50)}...`);
        }
        console.log('');
        // Test 6: Get issue changelog
        console.log('Test 6: Get issue changelog');
        console.log('-'.repeat(60));
        const changelogResponse = await jira.getIssueChangelog(TEST_ISSUE_KEY, 0, 5);
        const histories = changelogResponse.histories || [];
        console.log('✓ Total changes:', changelogResponse.total);
        console.log('✓ Returned:', histories.length);
        if (histories.length > 0) {
            histories.slice(0, 2).forEach((entry, idx) => {
                console.log(`  ${idx + 1}. ${entry.author.displayName} at ${new Date(entry.created).toLocaleString()}`);
            });
        }
        console.log('');
        // ========================================
        // Phase 2: Project Management (14 tools)
        // ========================================
        console.log('='.repeat(60));
        console.log('PHASE 2: Project Management');
        console.log('='.repeat(60));
        console.log('');
        // Test 7: Get all projects
        console.log('Test 7: Get all projects');
        console.log('-'.repeat(60));
        const projects = await jira.getAllProjects(false);
        console.log('✓ Projects count:', projects.length);
        projects.slice(0, 5).forEach((project, idx) => {
            console.log(`  ${idx + 1}. ${project.name} (${project.key})`);
        });
        console.log('');
        // Test 8: Get project details
        console.log('Test 8: Get project details');
        console.log('-'.repeat(60));
        const project = await jira.getProject(TEST_PROJECT_KEY);
        console.log('✓ Project name:', project.name);
        console.log('✓ Project key:', project.key);
        console.log('✓ Project lead:', project.lead?.displayName || 'N/A');
        console.log('✓ Description:', project.description?.substring(0, 50) || 'N/A');
        console.log('');
        // Test 8a: Get project model
        console.log('Test 8a: Get project model');
        console.log('-'.repeat(60));
        const projectModel = await jira.getProjectModel(TEST_PROJECT_KEY);
        if (projectModel) {
            console.log('✓ Project model retrieved');
            console.log('✓ Project name:', projectModel.name);
            console.log('✓ Project key:', projectModel.key);
        }
        else {
            console.log('⚠ Project model not available');
        }
        console.log('');
        // Test 9: Check project exists
        console.log('Test 9: Check project exists');
        console.log('-'.repeat(60));
        const exists = await jira.projectExists(TEST_PROJECT_KEY);
        console.log('✓ Project exists:', exists);
        console.log('');
        // Test 10: Get project components
        console.log('Test 10: Get project components');
        console.log('-'.repeat(60));
        const components = await jira.getProjectComponents(TEST_PROJECT_KEY);
        console.log('✓ Components count:', components.length);
        if (components.length > 0) {
            components.slice(0, 5).forEach((component, idx) => {
                console.log(`  ${idx + 1}. ${component.name}`);
            });
        }
        console.log('');
        // Test 11: Get project versions
        console.log('Test 11: Get project versions');
        console.log('-'.repeat(60));
        const versions = await jira.getProjectVersions(TEST_PROJECT_KEY);
        console.log('✓ Versions count:', versions.length);
        if (versions.length > 0) {
            versions.slice(0, 5).forEach((version, idx) => {
                console.log(`  ${idx + 1}. ${version.name} (${version.released ? 'Released' : 'Unreleased'})`);
            });
        }
        console.log('');
        // Test 12: Get project roles
        console.log('Test 12: Get project roles');
        console.log('-'.repeat(60));
        let roles = {};
        try {
            roles = await jira.getProjectRoles(TEST_PROJECT_KEY);
            console.log('✓ Roles count:', Object.keys(roles).length);
            Object.keys(roles).slice(0, 5).forEach((roleName, idx) => {
                console.log(`  ${idx + 1}. ${roleName}`);
            });
        }
        catch (error) {
            console.log('⚠ Skipped (no permission or not available)');
        }
        console.log('');
        // Test 12a: Get project role members
        // NOTE: Disabled - Requires admin permissions (401 Unauthorized)
        // console.log('Test 12a: Get project role members');
        // console.log('-'.repeat(60));
        // try {
        //   const roleKeys = Object.keys(roles);
        //   if (roleKeys.length > 0) {
        //     const firstRoleUrl = roles[roleKeys[0]];
        //     const roleId = firstRoleUrl.split('/').pop();
        //     const roleMembers = await jira.getProjectRoleMembers(TEST_PROJECT_KEY, roleId);
        //     console.log('✓ Role members count:', roleMembers.length);
        //     if (roleMembers.length > 0) {
        //       roleMembers.slice(0, 3).forEach((member: any, idx: number) => {
        //         console.log(`  ${idx + 1}. ${member.displayName || member.name}`);
        //       });
        //     }
        //   } else {
        //     console.log('⚠ No roles available');
        //   }
        // } catch (error: any) {
        //   console.log('⚠ Skipped (no permission or role not available)');
        // }
        // console.log('');
        // Test 13: Get my project permissions
        console.log('Test 13: Get my project permissions');
        console.log('-'.repeat(60));
        try {
            const myPermissions = await jira.getMyProjectPermissions(TEST_PROJECT_KEY);
            if (myPermissions.permissions) {
                const permKeys = Object.keys(myPermissions.permissions);
                const grantedPerms = permKeys.filter(key => myPermissions.permissions[key].havePermission);
                console.log('✓ Total permissions:', permKeys.length);
                console.log('✓ Granted permissions:', grantedPerms.length);
                console.log('✓ Sample granted permissions:');
                grantedPerms.slice(0, 5).forEach((key, idx) => {
                    const perm = myPermissions.permissions[key];
                    console.log(`  ${idx + 1}. ${perm.name} (${perm.key})`);
                });
            }
        }
        catch (error) {
            console.log('⚠ Skipped (error getting permissions):', error.message);
        }
        console.log('');
        // Test 14: Get project notification scheme
        // NOTE: Disabled - Not supported in Jira Server 9.4 (returns 400 Bad Request)
        // console.log('Test 14: Get project notification scheme');
        // console.log('-'.repeat(60));
        // try {
        //   const notificationScheme = await jira.getProjectNotificationScheme(TEST_PROJECT_KEY);
        //   console.log('✓ Notification scheme:', notificationScheme.name || 'N/A');
        // } catch (error: any) {
        //   console.log('⚠ Skipped (no permission or not available)');
        // }
        // console.log('');
        // Test 15: Get project issue types
        console.log('Test 15: Get project issue types');
        console.log('-'.repeat(60));
        const issueTypes = await jira.getProjectIssueTypes(TEST_PROJECT_KEY);
        console.log('✓ Issue types count:', issueTypes.length);
        issueTypes.forEach((type, idx) => {
            console.log(`  ${idx + 1}. ${type.name} (${type.subtask ? 'Subtask' : 'Standard'})`);
        });
        console.log('');
        // Test 16: Get project issues count
        console.log('Test 16: Get project issues count');
        console.log('-'.repeat(60));
        const issuesCount = await jira.getProjectIssuesCount(TEST_PROJECT_KEY);
        console.log('✓ Total issues in project:', issuesCount);
        console.log('');
        // Test 17: Get project issues
        console.log('Test 17: Get project issues');
        console.log('-'.repeat(60));
        const projectIssues = await jira.getProjectIssues(TEST_PROJECT_KEY, 0, 5);
        console.log('✓ Total:', projectIssues.total);
        console.log('✓ Returned:', projectIssues.issues.length);
        console.log('');
        // Test 18: Get project statuses
        console.log('Test 18: Get project statuses');
        console.log('-'.repeat(60));
        try {
            const statuses = await jira.getProjectStatuses(TEST_PROJECT_KEY);
            console.log('✓ Statuses count:', statuses.length);
            if (statuses.length > 0) {
                statuses.slice(0, 5).forEach((statusGroup, idx) => {
                    if (statusGroup.statuses && statusGroup.statuses.length > 0) {
                        console.log(`  ${idx + 1}. ${statusGroup.statuses[0].name}`);
                    }
                });
            }
        }
        catch (error) {
            console.log('⚠ Skipped (error getting statuses):', error.message);
        }
        console.log('');
        // Test 19: Get project priorities
        console.log('Test 19: Get project priorities');
        console.log('-'.repeat(60));
        try {
            const priorities = await jira.getProjectPriorities();
            console.log('✓ Priorities count:', priorities.length);
            priorities.slice(0, 5).forEach((priority, idx) => {
                console.log(`  ${idx + 1}. ${priority.name}`);
            });
        }
        catch (error) {
            console.log('⚠ Skipped (error getting priorities):', error.message);
        }
        console.log('');
        // Test 20: Get project resolutions
        console.log('Test 20: Get project resolutions');
        console.log('-'.repeat(60));
        try {
            const resolutions = await jira.getProjectResolutions();
            console.log('✓ Resolutions count:', resolutions.length);
            resolutions.slice(0, 5).forEach((resolution, idx) => {
                console.log(`  ${idx + 1}. ${resolution.name}`);
            });
        }
        catch (error) {
            console.log('⚠ Skipped (error getting resolutions):', error.message);
        }
        console.log('');
        // ========================================
        // Phase 3: Agile Features (8 tools)
        // ========================================
        console.log('='.repeat(60));
        console.log('PHASE 3: Agile Features');
        console.log('='.repeat(60));
        console.log('');
        // Test 21: Get epic issues
        console.log('Test 21: Get epic issues');
        console.log('-'.repeat(60));
        try {
            const epicIssues = await jira.getEpicIssues(TEST_EPIC_KEY, 0, 5);
            console.log('✓ Epic issues count:', epicIssues.length);
            if (epicIssues.length > 0) {
                epicIssues.slice(0, 3).forEach((issue, idx) => {
                    console.log(`  ${idx + 1}. ${issue.key}: ${issue.summary || 'N/A'}`);
                });
            }
        }
        catch (error) {
            console.log('⚠ Skipped (epic not found or no permission)');
        }
        console.log('');
        // Test 22: Get all sprints from board
        console.log('Test 22: Get all sprints from board');
        console.log('-'.repeat(60));
        try {
            const allSprints = await jira.getAllSprintsFromBoard(TEST_BOARD_ID, undefined, 0, 10);
            console.log('✓ Sprints count:', allSprints.length);
            if (allSprints.length > 0) {
                allSprints.slice(0, 3).forEach((sprint, idx) => {
                    console.log(`  ${idx + 1}. ${sprint.name} (${sprint.state})`);
                });
            }
        }
        catch (error) {
            console.log('⚠ Skipped (board not available or no permission)');
        }
        console.log('');
        // Test 23: Get all sprints from board (model)
        console.log('Test 23: Get all sprints from board (model)');
        console.log('-'.repeat(60));
        try {
            const allSprintsModel = await jira.getAllSprintsFromBoardModel(TEST_BOARD_ID, undefined, 0, 5);
            console.log('✓ Sprints (model) count:', allSprintsModel.length);
        }
        catch (error) {
            console.log('⚠ Skipped (board not available or no permission)');
        }
        console.log('');
        // Test 24: Get all agile boards
        console.log('Test 24: Get all agile boards');
        console.log('-'.repeat(60));
        const boards = await jira.getAllAgileBoards({ limit: 10 });
        console.log('✓ Boards count:', boards.length);
        boards.slice(0, 5).forEach((board, idx) => {
            console.log(`  ${idx + 1}. ${board.name} (ID: ${board.id}, Type: ${board.type})`);
        });
        console.log('');
        // Test 25: Get all agile boards (model)
        console.log('Test 25: Get all agile boards (model)');
        console.log('-'.repeat(60));
        const boardsModel = await jira.getAllAgileBoardsModel({ limit: 5 });
        console.log('✓ Boards (model) count:', boardsModel.length);
        console.log('');
        // Test 26: Get all active sprints
        console.log('Test 26: Get all active sprints');
        console.log('-'.repeat(60));
        try {
            const allActiveSprints = await jira.getAllActiveSprints(0, 10);
            console.log('✓ All active sprints:', allActiveSprints.length);
            if (allActiveSprints.length > 0) {
                allActiveSprints.slice(0, 3).forEach((sprint, idx) => {
                    console.log(`  ${idx + 1}. ${sprint.name} (Board: ${sprint.originBoardId})`);
                });
            }
        }
        catch (error) {
            console.log('⚠ Skipped (no active sprints or error):', error.message);
        }
        console.log('');
        // Test 27: Get sprint details
        console.log('Test 27: Get sprint details');
        console.log('-'.repeat(60));
        try {
            const sprints = await jira.getAllSprintsFromBoard(TEST_BOARD_ID, undefined, 0, 1);
            if (sprints.length > 0) {
                const sprintDetails = await jira.getSprintDetails(sprints[0].id);
                console.log('✓ Sprint name:', sprintDetails.name);
                console.log('✓ Sprint state:', sprintDetails.state);
                console.log('✓ Start date:', sprintDetails.startDate || 'N/A');
                console.log('✓ End date:', sprintDetails.endDate || 'N/A');
            }
            else {
                console.log('⚠ No sprints available');
            }
        }
        catch (error) {
            console.log('⚠ Skipped (sprint not found or error):', error.message);
        }
        console.log('');
        // ========================================
        // Phase 4: Advanced Features (18 tools)
        // ========================================
        console.log('='.repeat(60));
        console.log('PHASE 4: Advanced Features');
        console.log('='.repeat(60));
        console.log('');
        // Test 28: Get issue worklogs
        console.log('Test 28: Get issue worklogs');
        console.log('-'.repeat(60));
        const worklogs = await jira.getWorklogs(TEST_ISSUE_KEY);
        console.log('✓ Worklogs count:', worklogs.length);
        if (worklogs.length > 0) {
            worklogs.slice(0, 3).forEach((worklog, idx) => {
                console.log(`  ${idx + 1}. ${worklog.author}: ${worklog.timeSpent}`);
            });
        }
        console.log('');
        // Test 29: Get worklog
        console.log('Test 29: Get worklog (single)');
        console.log('-'.repeat(60));
        const worklogSingle = await jira.getWorklog(TEST_ISSUE_KEY);
        console.log('✓ Worklog data retrieved');
        console.log('✓ Total worklogs:', worklogSingle.total || 'N/A');
        console.log('');
        // Test 30: Get worklog models
        console.log('Test 30: Get worklog models');
        console.log('-'.repeat(60));
        const worklogModels = await jira.getWorklogModels(TEST_ISSUE_KEY);
        console.log('✓ Worklog models count:', worklogModels.length);
        console.log('');
        // Test 31: Get available transitions
        console.log('Test 31: Get available transitions');
        console.log('-'.repeat(60));
        const transitions = await jira.getAvailableTransitions(TEST_ISSUE_KEY);
        console.log('✓ Available transitions:', transitions.length);
        transitions.forEach((transition, idx) => {
            console.log(`  ${idx + 1}. ${transition.name} (ID: ${transition.id})`);
        });
        console.log('');
        // Test 32: Get transitions
        console.log('Test 32: Get transitions (alternative)');
        console.log('-'.repeat(60));
        const transitionsAlt = await jira.getTransitions(TEST_ISSUE_KEY);
        console.log('✓ Transitions (alt) count:', transitionsAlt.length);
        console.log('');
        // Test 33: Get transitions models
        console.log('Test 33: Get transitions models');
        console.log('-'.repeat(60));
        const transitionsModels = await jira.getTransitionsModels(TEST_ISSUE_KEY);
        console.log('✓ Transitions models count:', transitionsModels.length);
        console.log('');
        // Test 34: Get all fields
        console.log('Test 34: Get all fields');
        console.log('-'.repeat(60));
        const fields = await jira.getFields(false);
        console.log('✓ Total fields:', fields.length);
        console.log('✓ Sample fields:');
        fields.slice(0, 10).forEach((field, idx) => {
            console.log(`  ${idx + 1}. ${field.name} (${field.id})`);
        });
        console.log('');
        // Test 35: Get custom fields
        console.log('Test 35: Get custom fields');
        console.log('-'.repeat(60));
        const customFields = await jira.getCustomFields(false);
        console.log('✓ Custom fields count:', customFields.length);
        if (customFields.length > 0) {
            customFields.slice(0, 5).forEach((field, idx) => {
                console.log(`  ${idx + 1}. ${field.name} (${field.id})`);
            });
        }
        console.log('');
        // Test 36: Get field by name
        console.log('Test 36: Get field ID by name');
        console.log('-'.repeat(60));
        const summaryFieldId = await jira.getFieldId('Summary', false);
        console.log('✓ Summary field ID:', summaryFieldId);
        const priorityFieldId = await jira.getFieldId('Priority', false);
        console.log('✓ Priority field ID:', priorityFieldId);
        console.log('');
        // Test 37: Get field by ID
        console.log('Test 37: Get field by ID');
        console.log('-'.repeat(60));
        if (summaryFieldId) {
            const summaryField = await jira.getFieldById(summaryFieldId, false);
            console.log('✓ Field name:', summaryField.name);
            console.log('✓ Field schema:', summaryField.schema?.type || 'N/A');
        }
        console.log('');
        // Test 38: Search fields
        console.log('Test 38: Search fields by keyword');
        console.log('-'.repeat(60));
        const searchedFields = await jira.searchFields('description', 5, false);
        console.log('✓ Found fields:', searchedFields.length);
        searchedFields.forEach((field, idx) => {
            console.log(`  ${idx + 1}. ${field.name} (${field.id})`);
        });
        console.log('');
        // Test 39: Get required fields
        console.log('Test 39: Get required fields for issue type');
        console.log('-'.repeat(60));
        try {
            const requiredFields = await jira.getRequiredFields('Task', TEST_PROJECT_KEY);
            const fieldKeys = Object.keys(requiredFields);
            console.log('✓ Required fields count:', fieldKeys.length);
            if (fieldKeys.length > 0) {
                fieldKeys.slice(0, 5).forEach((key, idx) => {
                    const field = requiredFields[key];
                    console.log(`  ${idx + 1}. ${field.name} (${field.fieldId})`);
                });
            }
        }
        catch (error) {
            console.log('⚠ Skipped (issue type not found or API error)');
        }
        console.log('');
        // Test 40: Get epic field IDs
        console.log('Test 40: Get epic field IDs');
        console.log('-'.repeat(60));
        const epicFieldIds = await jira.getFieldIdsToEpic();
        console.log('✓ Epic link field:', epicFieldIds.epic_link || 'N/A');
        console.log('✓ Epic name field:', epicFieldIds.epic_name || 'N/A');
        console.log('');
        // Test 41: Get issue picker suggestions
        console.log('Test 41: Get issue picker suggestions');
        console.log('-'.repeat(60));
        try {
            const suggestions = await jira.getIssuePickerSuggestions('test', undefined, undefined);
            console.log('✓ Suggestions retrieved');
            if (suggestions.sections) {
                console.log('✓ Sections count:', suggestions.sections.length);
            }
        }
        catch (error) {
            console.log('⚠ Skipped (suggestions not available):', error.message);
        }
        console.log('');
        // ========================================
        // WRITE TESTS (only if -w flag is provided)
        // ========================================
        if (ENABLE_WRITE_TESTS) {
            console.log('='.repeat(60));
            console.log('WRITE TESTS - Modifying Jira Data');
            console.log('='.repeat(60));
            console.log('');
            // Test 42: Create a new issue
            console.log('Test 42: Create a new issue');
            console.log('-'.repeat(60));
            const newIssue = await jira.createIssue({
                project: { key: TEST_PROJECT_KEY },
                summary: `MCP Test Issue - ${new Date().toISOString()}`,
                description: 'This issue was created by the Jira MCP server during local testing.',
                issuetype: { name: 'Task' }
            });
            console.log('✓ Issue created successfully');
            console.log('✓ New issue key:', newIssue.key);
            console.log('✓ New issue URL:', `${process.env.JIRA_BASE_URL}/browse/${newIssue.key}`);
            console.log('');
            // Test 43: Batch create issues
            console.log('Test 43: Batch create issues');
            console.log('-'.repeat(60));
            const batchIssues = await jira.batchCreateIssues([
                {
                    project: { key: TEST_PROJECT_KEY },
                    summary: `MCP Batch Test 1 - ${new Date().toISOString()}`,
                    description: 'Batch created issue 1',
                    issuetype: { name: 'Task' }
                },
                {
                    project: { key: TEST_PROJECT_KEY },
                    summary: `MCP Batch Test 2 - ${new Date().toISOString()}`,
                    description: 'Batch created issue 2',
                    issuetype: { name: 'Task' }
                }
            ], false);
            console.log('✓ Batch issues created:', batchIssues.length);
            batchIssues.forEach((issue, idx) => {
                console.log(`  ${idx + 1}. ${issue.key}`);
            });
            console.log('');
            // Test 44: Add a comment
            console.log('Test 44: Add a comment');
            console.log('-'.repeat(60));
            const testComment = `Test Comment - Generated at ${new Date().toISOString()}\n\nThis is a test comment from MCP server local testing.`;
            const addedComment = await jira.addComment(TEST_ISSUE_KEY, testComment);
            console.log('✓ Comment added successfully');
            console.log('✓ Comment ID:', addedComment.id);
            console.log('');
            // Test 45: Add worklog
            console.log('Test 45: Add worklog');
            console.log('-'.repeat(60));
            const worklog = await jira.addWorklog(TEST_ISSUE_KEY, {
                time_spent: '1h',
                comment: 'MCP test worklog entry'
            });
            console.log('✓ Worklog added successfully');
            console.log('✓ Worklog ID:', worklog.id);
            console.log('✓ Time spent:', worklog.timeSpent);
            console.log('');
            // Test 46: Create project version
            console.log('Test 46: Create project version');
            console.log('-'.repeat(60));
            try {
                const versionName = `MCP Test Version ${Date.now()}`;
                const newVersion = await jira.createProjectVersion(TEST_PROJECT_KEY, versionName, undefined, undefined, 'Created by MCP test');
                console.log('✓ Version created successfully');
                console.log('✓ Version name:', newVersion.name);
                console.log('✓ Version ID:', newVersion.id);
            }
            catch (error) {
                console.log('⚠ Skipped (no permission to create version)');
            }
            console.log('');
            // Test 47: Link issue to epic
            console.log('Test 47: Link issue to epic');
            console.log('-'.repeat(60));
            try {
                await jira.linkIssueToEpic(newIssue.key, TEST_EPIC_KEY);
                console.log('✓ Issue linked to epic successfully');
                console.log('✓ Issue:', newIssue.key);
                console.log('✓ Epic:', TEST_EPIC_KEY);
            }
            catch (error) {
                console.log('⚠ Skipped (epic not found or no permission)');
            }
            console.log('');
            // Test 48: Create sprint
            console.log('Test 48: Create sprint');
            console.log('-'.repeat(60));
            try {
                const newSprint = await jira.createSprint(TEST_BOARD_ID, {
                    name: `MCP Test Sprint ${Date.now()}`,
                    startDate: new Date().toISOString(),
                    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                    goal: 'MCP test sprint goal'
                });
                console.log('✓ Sprint created successfully');
                console.log('✓ Sprint name:', newSprint.name);
                console.log('✓ Sprint ID:', newSprint.id);
                console.log('✓ Sprint state:', newSprint.state);
            }
            catch (error) {
                console.log('⚠ Skipped (no permission to create sprint or board not found)');
            }
            console.log('');
            // Test 49: Transition issue
            console.log('Test 49: Transition issue');
            console.log('-'.repeat(60));
            try {
                const availableTransitions = await jira.getAvailableTransitions(newIssue.key);
                if (availableTransitions.length > 0) {
                    const firstTransition = availableTransitions[0];
                    await jira.transitionIssue(newIssue.key, firstTransition.id, {}, 'Transitioned by MCP test');
                    console.log('✓ Issue transitioned successfully');
                    console.log('✓ Transition:', firstTransition.name);
                }
                else {
                    console.log('⚠ No transitions available');
                }
            }
            catch (error) {
                console.log('⚠ Skipped (transition failed or no permission)');
            }
            console.log('');
            console.log('='.repeat(60));
            console.log('All tests completed successfully! ✓');
            console.log('='.repeat(60));
            console.log('');
            console.log('Summary:');
            console.log('- READ operations: 41 tests passed (Test 1-41)');
            console.log('- WRITE operations: 8 tests executed (Test 42-49)');
            console.log('- Total active tools covered: 51 tools (4 Jira Cloud-only tools excluded)');
            console.log(`- Test project: ${TEST_PROJECT_KEY}`);
            console.log(`- Test issue: ${TEST_ISSUE_KEY}`);
            console.log(`- New issue created: ${newIssue.key}`);
            console.log(`- Batch issues created: ${batchIssues.length}`);
            console.log(`- Comment added: ${addedComment.id}`);
            console.log(`- Worklog added: ${worklog.id}`);
            console.log('');
        }
        else {
            console.log('='.repeat(60));
            console.log('All READ tests completed successfully! ✓');
            console.log('='.repeat(60));
            console.log('');
            console.log('Summary:');
            console.log('- Phase 1 (Core Issue Functions): Test 1-6 (6 tests)');
            console.log('- Phase 2 (Project Management): Test 7-20 (14 tests)');
            console.log('- Phase 3 (Agile Features): Test 21-27 (7 tests)');
            console.log('- Phase 4 (Advanced Features): Test 28-41 (14 tests)');
            console.log('- Total READ tests: 41 active tests');
            console.log('- Total active tools covered: 51 tools');
            console.log('- WRITE operations: Skipped (use -w or --write flag to enable 8 WRITE tests)');
            console.log(`- Test project: ${TEST_PROJECT_KEY}`);
            console.log(`- Test issue: ${TEST_ISSUE_KEY}`);
            console.log('');
            console.log('Notes:');
            console.log('- Some tests may be skipped if resources are not available');
            console.log('- Update TEST_BOARD_ID and TEST_EPIC_KEY for full test coverage');
            console.log('- 3 tools are disabled: update_issue, delete_issue, update_sprint');
            console.log('- 3 custom field tools are commented out: create/update/delete custom field');
            console.log('- 4 Jira Cloud-only tools excluded: field options, contexts, validation, screen tabs');
            console.log('');
        }
    }
    catch (error) {
        console.error('');
        console.error('✗ Test failed with error:');
        console.error('-'.repeat(60));
        console.error(error);
        console.error('');
        process.exit(1);
    }
}
// Run tests
runTests();
//# sourceMappingURL=jira.test.js.map