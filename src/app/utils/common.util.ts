import { BigNumber } from '@ethersproject/bignumber';
import { ethers } from 'ethers';

export class CommonUtil {

  public static isString(value: any): boolean {
    return typeof value === 'string' || value instanceof String;
  }

  public static isNullOrWhitespace(value: string): boolean {
    if (!CommonUtil.isString(value)) {
      // console.log('Expected a string but got: ', value);
      return true;
    } else {
      return value === null || value === undefined || value.trim() === '';
    }
  }

  public static toBigNumber(bn: any): BigNumber {
    return BigNumber.from(bn);
  }

  public static toJsonString(data: any): string {
    return JSON.stringify(data, null, 2);
  }

  public static formatBigNumber(bn: any): string {
    return ethers.utils.formatUnits(BigNumber.from(bn), 18);
  }

  public static timeout(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
