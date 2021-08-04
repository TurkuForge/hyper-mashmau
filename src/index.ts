import { JsonPointer, PathSegments } from 'json-ptr';
import { Link, Resource } from 'halfred';

export interface HyperMashmauParams {
    httpClient: HttpClient;
    apiRootUrl: string;
}

type ArrayOrSingle<T = Record<string, unknown>> = T extends Array<T> ? T[] : T;

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

    async get<T = Record<string, unknown>>(mashmauPointer: string): Promise<ArrayOrSingle<T>> {
        await this.isRootPending();
        return this.findResource<T>(mashmauPointer, this.apiRoot as Resource);
    }

    private async findResource<T>(mashmauPointer: string, resource: Resource): Promise<ArrayOrSingle<T>> {
        const { data, jsonPointer } = this.getJsonPointerAndData(mashmauPointer);
        let resources = await this.getResource(jsonPointer, resource);
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
            }) as unknown as ArrayOrSingle<T>;
        }

        return Promise.reject(
            `Cannot find resource matching pattern ${this.convertToMashmauPointer(jsonPointer, data)}`,
        );
    }

    private async getResource(jsonPointer: JsonPointer, resource: Resource): Promise<Resource | Resource[] | void> {
        let resources: Resource | Resource[] | Promise<Resource | Resource[] | void> = jsonPointer.get(
            resource.original(),
        ) as Resource;

        if (!resources) {
            resources = this.getEmbeddedResource(jsonPointer, resource);
        }
        if (!resources) {
            resources = this.getLinkedResource(jsonPointer, resource);
        }

        return resources;
    }

    private async getLinkedResource(pointer: JsonPointer, resource: Resource) {
        const links = resource.allLinkArrays();
        const findCorrectPath = (path: PathSegments): JsonPointer | void => {
            const jsonPointer = JsonPointer.create(path);
            if (JsonPointer.has(links, jsonPointer)) {
                return jsonPointer;
            } else {
                path.pop();
                return findCorrectPath(path);
            }
        };
        const linkPointer = findCorrectPath([...pointer.path]);
        if (linkPointer && linkPointer.path.length > 0) {
            const linkResource = linkPointer.get(links);
            let link: Link;
            if (Array.isArray(linkResource)) {
                link = linkResource[0];
            } else {
                link = linkResource as Link;
            }

            this.httpClient.get(link);
            const response = await this.httpClient.getResponse();
            const path = pointer.path.filter((item) => !linkPointer.path.includes(item));
            return this.getResource(JsonPointer.create(path), response);
        }
    }

    private getEmbeddedResource(pointer: JsonPointer, resource: Resource) {
        const embedded = resource.allEmbeddedResourceArrays();
        return pointer.get(embedded) as Resource | Resource[];
    }

    private getJsonPointerAndData(pointer: string): { data: string[]; jsonPointer: JsonPointer } {
        pointer = pointer.replace(/(\s+?\r\n|\s+?\n|\r|\s)/gm, '');
        const start = pointer.indexOf(START_CONTENT_CHARACTER);
        const end = pointer.lastIndexOf(END_CONTENT_CHARACTER);
        const data = pointer.slice(start + 1, end).split(',');
        if (data[data.length - 1] === '') {
            // In case a trailing comma was present in the pointer
            data.pop();
        }

        const jsonPointer = pointer.slice(0, start - 1);

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

    private convertToMashmauPointer(jsonPointer: JsonPointer, data: string[]) {
        return `${jsonPointer.pointer}/{${data.join(',')}}`;
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
