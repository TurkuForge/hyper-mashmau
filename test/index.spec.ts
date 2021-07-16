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
    const sandbox = sinon.createSandbox();
    const httpClient = sandbox.spy(new MockFsAPI());
    before(() => {
        hyperMashmau = new HyperMashmau({
            httpClient,
            apiRootUrl: '/api/root',
        });
    });

    it('Gets full user data from user resource', async () => {
        const { name, age, gender } = await hyperMashmau.get<UserResponse>(`/hm:users/0/{
            name,
            age,
            gender,
        }`);
        expect(name).to.equal('Hugo First');
        expect(age).to.equal(52);
        expect(gender).to.equal('non-binary');

        expect(httpClient.get.calledWith({ href: 'https://example.org/api/user/0', templated: false })).to.true;
    });

    it('Gets list of all properties', async () => {
        const [hugo, percy] = await hyperMashmau.get<UserResponse[]>(`/hm:users/{
            name,
            age,
            gender,
        }`);

        expect(hugo.name).to.equal('Hugo First');
        expect(hugo.age).to.equal(52);
        expect(hugo.gender).to.equal('non-binary');

        expect(percy.name).to.equal('Percy Vere');
        expect(percy.age).to.equal(35);
        expect(percy.gender).to.equal('female');

        expect(httpClient.get.calledWith({ href: 'https://example.org/api/user/0', templated: false })).to.true;
        expect(httpClient.get.calledWith({ href: 'https://example.org/api/user/1', templated: false })).to.true;
    });

    it('Gets only embedded user data', async () => {
        const { name } = await hyperMashmau.get(`/hm:users/0/{name}`);
        expect(name).to.equal('Hugo First');
        expect(httpClient.get.calledWith({ href: 'https://example.org/api/user/0', templated: false })).to.false;
    });

    it('Gets data from a link when its not present in the embedded', () => {});
});
