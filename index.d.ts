interface HttpClient {
    get(arg: HttpClientUrl): void;
    put(arg: HttpClientUrl): void;
    head(arg: HttpClientUrl): void;
    post(arg: HttpClientUrl): void;
    patch(arg: HttpClientUrl): void;
    trace?(arg: HttpClientUrl): void;
    delete(arg: HttpClientUrl): void;
    connect?(arg: HttpClientUrl): void;
    options(arg: HttpClientUrl): void;
    getResponse(): Promise<any>;
}

type HttpClientUrl = Self | string;

interface Self {
    href: string;
    templated?: boolean;
    name?: string;
}
