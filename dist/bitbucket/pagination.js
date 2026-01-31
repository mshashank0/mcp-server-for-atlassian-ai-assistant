export const BITBUCKET_DEFAULT_LIMIT = 25;
export const BITBUCKET_MAX_LIMIT = 100;
export const BITBUCKET_ALL_ITEMS_CAP = 1000;
export class BitbucketPaginator {
    api;
    logger;
    constructor(api, logger) {
        this.api = api;
        this.logger = logger;
    }
    async fetchValues(path, options = {}) {
        const { start, limit, all = false, params = {}, defaultLimit = BITBUCKET_DEFAULT_LIMIT, maxItems = BITBUCKET_ALL_ITEMS_CAP, description, } = options;
        const resolvedLimit = this.normalizeLimit(limit ?? defaultLimit);
        const requestParams = {
            ...params,
            limit: resolvedLimit,
        };
        if (start !== undefined) {
            requestParams.start = start;
        }
        const shouldFetchAll = all === true && start === undefined;
        const requestDescriptor = {
            url: path,
            params: requestParams,
        };
        if (!shouldFetchAll) {
            const response = await this.performRequest(requestDescriptor, description);
            const values = this.extractValues(response.data);
            return {
                values,
                start: response.data?.start ?? start,
                limit: response.data?.limit ?? resolvedLimit,
                size: response.data?.size ?? values.length,
                isLastPage: response.data?.isLastPage ?? true,
                nextPageStart: response.data?.nextPageStart,
                fetchedPages: 1,
                totalFetched: values.length,
            };
        }
        // Fetch all pages
        const aggregated = [];
        let fetchedPages = 0;
        let currentStart = 0;
        let firstPageMeta = { limit: resolvedLimit };
        while (aggregated.length < maxItems) {
            const currentRequest = {
                url: path,
                params: {
                    ...params,
                    start: currentStart,
                    limit: resolvedLimit,
                },
            };
            const response = await this.performRequest(currentRequest, description, {
                page: fetchedPages + 1,
            });
            fetchedPages += 1;
            if (fetchedPages === 1) {
                firstPageMeta = {
                    start: response.data?.start,
                    limit: response.data?.limit ?? resolvedLimit,
                };
            }
            const values = this.extractValues(response.data);
            aggregated.push(...values);
            if (response.data?.isLastPage === true) {
                break;
            }
            if (!response.data?.nextPageStart) {
                break;
            }
            if (aggregated.length >= maxItems) {
                this.logger?.debug('Bitbucket pagination cap reached', {
                    description: description ?? path,
                    maxItems,
                });
                break;
            }
            this.logger?.debug('Following Bitbucket pagination nextPageStart', {
                description: description ?? path,
                nextPageStart: response.data.nextPageStart,
                fetchedPages,
                totalFetched: aggregated.length,
            });
            currentStart = response.data.nextPageStart;
        }
        if (aggregated.length > maxItems) {
            aggregated.length = maxItems;
        }
        return {
            values: aggregated,
            start: firstPageMeta.start,
            limit: firstPageMeta.limit,
            size: aggregated.length,
            isLastPage: true,
            fetchedPages,
            totalFetched: aggregated.length,
        };
    }
    async performRequest(request, description, extra) {
        this.logger?.debug('Calling Bitbucket API', {
            description: description ?? request.url,
            url: request.url,
            params: request.params,
            ...extra,
        });
        const config = request.params ? { params: request.params } : undefined;
        return this.api.get(request.url, config);
    }
    extractValues(data) {
        if (Array.isArray(data?.values)) {
            return data.values;
        }
        if (Array.isArray(data)) {
            return data;
        }
        return [];
    }
    normalizeLimit(value) {
        if (value === undefined || Number.isNaN(value)) {
            return BITBUCKET_DEFAULT_LIMIT;
        }
        const integer = Math.floor(value);
        if (!Number.isFinite(integer) || integer < 1) {
            return 1;
        }
        return Math.min(integer, BITBUCKET_MAX_LIMIT);
    }
}
//# sourceMappingURL=pagination.js.map