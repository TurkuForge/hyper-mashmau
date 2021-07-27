import { parse, Resource } from 'halfred';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const FAKE_DOMAIN = 'https://exaple.org';

export default class MockFsAPI implements HttpClient {
    private activePromise?: Promise<Record<string, unknown>>;

    delete(arg: HttpClientUrl): void {
        throw new Error('@TOOD: implament');
    }

    get(arg: HttpClientUrl): void {
        this.activePromise = this.readFile(MockFsAPI.toUrl(arg));
    }

    head(arg: HttpClientUrl): void {
        throw new Error('@TOOD: implament');
    }

    options(arg: HttpClientUrl): void {
        throw new Error('@TOOD: implament');
    }

    patch(arg: HttpClientUrl): void {
        throw new Error('@TOOD: implament');
    }

    post(arg: HttpClientUrl): void {
        throw new Error('@TOOD: implament');
    }

    put(arg: HttpClientUrl): void {
        throw new Error('@TOOD: implament');
    }

    async getResponse(): Promise<Resource> {
        if (!this.activePromise) {
            throw new Error('No active promises, are you sure you made a request?');
        }
        return parse(await this.getActivePromise());
    }

    private static toUrl(arg: HttpClientUrl): URL {
        if (typeof arg !== 'string') {
            arg = (arg as Self).href;
        }

        if (!arg.includes('http') || !arg.includes('https')) {
            arg = FAKE_DOMAIN + arg;
        }

        return new URL(arg);
    }

    private async readFile(url: URL): Promise<Record<string, unknown>> {
        return new Promise((resolve, reject) => {
            /**
             * The `path` should resemble the mock api directory structure.
             * @example
             *  // If the url looks like this
             *  http://example.org/api/user/0
             *  // The readFile path paramater should looks like this
             *  fs.readFile(`./api/user/0.json`)
             */
            const fileName = url.search.length ? `${url.pathname}${url.search}` : url.pathname;
            fs.readFile(`${__dirname}${fileName}.json`, 'utf8', function (err: unknown, data: string) {
                if (err) {
                    reject(err);
                }
                resolve(JSON.parse(data));
            });
        });
    }

    private async getActivePromise(): Promise<Record<string, unknown>> {
        const response = (await this.activePromise) as Record<string, unknown>;
        this.activePromise = undefined;
        return response;
    }
}
