import { hello } from '@/index'
import { expect } from 'chai';

describe('index', () => { // the tests container
    it('returns hello world', () => {
	expect(hello().trim()).to.equal('Hello world!'.trim())
    })
});
