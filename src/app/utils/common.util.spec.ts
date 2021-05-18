import { TestBed } from '@angular/core/testing';
import { CommonUtil } from './common.util';

describe('CommonUtil', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('combineIndex should return combined index with same order', () => {
    const index1 = '0x88ad';
    const index2 = '0xA5B7';
    expect(CommonUtil.combineIndex(undefined, undefined)).toBeUndefined();
    expect(CommonUtil.combineIndex(index1, undefined)).toBeUndefined();
    expect(CommonUtil.combineIndex(undefined, index2)).toBeUndefined();
    expect(CommonUtil.combineIndex(index1, index2)).toBe('0x88ad_0xA5B7');
    expect(CommonUtil.combineIndex(index2, index1)).toBe('0x88ad_0xA5B7');
  });

});
