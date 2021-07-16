import { JsonPointer } from 'json-ptr';
import { Resource } from 'halfred';

export interface HyperMashmauParams {
    httpClient: HttpClient;
    apiRootUrl: string;
}

const START_CONTENT_CHARACTER = '{';
const END_CONTENT_CHARACTER = '}';

export class HyperMashmau {
    private httpClient: HttpClient;
    private apiRoot?: Resource;
    private readonly rootRequest: Promise<Record<string, unknown>>;

    constructor({ httpClient, apiRootUrl }: HyperMashmauParams) {
        if (!httpClient) {
            throw new Error('httpClient is required');
        }
        this.httpClient = httpClient;

        this.httpClient.get(apiRootUrl);
        this.rootRequest = this.httpClient.getResponse();
    }

    async get<T = Record<string, unknown>>(pointer: string): Promise<any> {
        await this.isRootPending();
        const { data, jsonPointer } = this.getJsonPointerAndData(pointer);
        const embedded = this.apiRoot?.allEmbeddedResourceArrays();
        let resources = jsonPointer.get(embedded) as Resource | Resource[];
        if (resources) {
            if (!Array.isArray(resources)) {
                resources = [resources] as Resource[];
            }

            return Promise.all(
                resources.map(async (resource) => {
                    if (this.hasAllKeys(resource, data)) {
                        return this.makeResponse<T>(resource, data);
                    } else {
                        const self = resource.link('self');
                        this.httpClient.get(self);
                        return this.makeResponse<T>(await this.httpClient.getResponse(), data);
                    }
                }),
            ).then((response) => {
                if (response.length === 1) {
                    return response[0];
                }

                return response;
            });
        }

        return Promise.reject(`Cannot find resource matching pattern ${pointer}`);
    }

    private getJsonPointerAndData(pointer: string): { data: string[]; jsonPointer: JsonPointer } {
        pointer = pointer.replace(/(\s+?\r\n|\s+?\n|\r|\s)/gm, '');
        const start = pointer.indexOf(START_CONTENT_CHARACTER);
        const end = pointer.lastIndexOf(END_CONTENT_CHARACTER);
        const data = pointer.slice(start + 1, end).split(',');
        if (data[data.length - 1] === '') {
            data.pop();
        }

        let jsonPointer = pointer.slice(0, start - 1);
        if (jsonPointer.slice(jsonPointer.length - 1) === '/') {
            // in case depth is not specified it will return everything
            jsonPointer += '-';
        }

        return { data, jsonPointer: new JsonPointer(jsonPointer) };
    }

    private async makeResponse<T>(responseData: Resource, data: string[]): Promise<T> {
        return new Promise<T>((resolve) => {
            resolve(
                data.reduce((memo, key) => {
                    Object.defineProperty(memo, key, {
                        get() {
                            return (responseData as unknown as Record<string, unknown>)[key];
                        },
                    });
                    return memo;
                }, {}) as unknown as T,
            );
        });
    }

    private async isRootPending() {
        this.apiRoot = (await this.rootRequest) as unknown as Resource;
    }

    private hasAllKeys(object: Resource, keys: string[]): boolean {
        const objectKeys = Object.keys(object);
        // Returns false if the keys are not present in the object
        return keys.filter((key) => objectKeys.includes(key)).length === keys.length;
    }
}
