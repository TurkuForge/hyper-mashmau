import { HyperMashmau } from '@/index';
import { expect } from 'chai';
import * as sinon from 'sinon';
import MockFsAPI from './mocks/MockFsAPI';

interface UserResponse {
    name?: string;
    age?: number;
    gender?: string;
}

describe('HyperMashmau usage', () => {
    let hyperMashmau: HyperMashmau;
    let httpClient: sinon.SinonSpiedInstance<HttpClient>;
    before(() => {
        const sandbox = sinon.createSandbox();
        httpClient = sandbox.spy(new MockFsAPI());
        hyperMashmau = new HyperMashmau({
            httpClient,
            apiRootUrl: 'https://example.org/api/root',
        });
    });

    it('Can get data straight from _embedded without any API requests', async () => {
        const { name } = await hyperMashmau.get(`/hm:users/0/{name}`);
        expect(httpClient.get.lastCall).to.not.equal({ href: 'https://example.org/api/user/0', templated: false });
        expect(name).to.equal('Hugo First');
    });

    it('Can get full resource from self link when data is missing in _embedded', async () => {
        const { name, age, gender } = await hyperMashmau.get<UserResponse>(`/hm:users/0/{
            name,
            age,
            gender,
        }`);

        expect(httpClient.get.calledWith({ href: 'https://example.org/api/user/0', templated: false })).to.true;
        expect(name).to.equal('Hugo First');
        expect(age).to.equal(52);
        expect(gender).to.equal('non-binary');
    });

    it('Can get full resource from each item in the list when data is missing from _embedded', async () => {
        const [hugo, percy] = await hyperMashmau.get<UserResponse[]>(`/hm:users/{
            name,
            age,
            gender,
        }`);

        expect(httpClient.get.calledWith({ href: 'https://example.org/api/user/0', templated: false })).to.true;
        expect(hugo.name).to.equal('Hugo First');
        expect(hugo.age).to.equal(52);
        expect(hugo.gender).to.equal('non-binary');

        expect(httpClient.get.calledWith({ href: 'https://example.org/api/user/1', templated: false })).to.true;
        expect(percy.name).to.equal('Percy Vere');
        expect(percy.age).to.equal(35);
        expect(percy.gender).to.equal('female');
    });

    it('Can get a resources by following _links', async () => {
        const { name, age, gender } = await hyperMashmau.get<UserResponse>(`/next/hm:users/0/{
            name,
            age,
            gender, 
        }`);

        expect(httpClient.get.calledWith({ href: 'https://example.org/api/user?page=2', templated: false })).to.true;
        expect(httpClient.get.calledWith({ href: 'https://example.org/api/user/2', templated: false })).to.true;

        expect(name).equal('Sally Smith');
        expect(age).to.equal(48);
        expect(gender).to.equal('female');
    });

    it('Can get resources by following mutable steps of _links', async () => {
        const { name, age, gender } = await hyperMashmau.get<UserResponse>(`/next/last/hm:users/1/{
            name,
            age,
            gender, 
        }`);

        expect(httpClient.get.calledWith({ href: 'https://example.org/api/user?page=2', templated: false })).to.true;
        expect(httpClient.get.calledWith({ href: 'https://example.org/api/user?page=25', templated: false })).to.true;
        expect(httpClient.get.calledWith({ href: 'https://example.org/api/user/50', templated: false })).to.true;

        expect(name).equal('Evan Butler');
        expect(age).to.equal(18);
        expect(gender).to.equal('male');
    });
});
